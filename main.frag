#version 300 es

precision highp float;
precision highp int;

/////
//
// Description : Array and textureless GLSL 2D simplex noise function.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
// 

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+10.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
/////

uniform float in_view_height_logical;
uniform vec2 in_reso;
uniform float in_time;
uniform highp sampler2D in_tex_glass;
uniform float in_glass_visible;
uniform float in_glass_visible_min;

layout (location=0) out vec4 magic_fragColor;

const float pi = 3.1415926535897;

// lch = lightness (0-1), chroma (saturation) (0-999999), hue (degrees)
vec3 oklch(vec3 lch) {
    float l = lch.x;
    float c = lch.y;
    float h = lch.z / 360. * 2. * pi;
    vec3 lab = vec3(l, c * cos(h), c * sin(h));
    mat3 M1_inv = mat3(
        4.0767416621, -3.3077115913, 0.2309699292,
        -1.2684380046, 2.6097574011, - 0.3413193965,
        -0.0041960863, -0.7034186147, 1.7076147010
    );
    mat3 M2_inv = mat3(
        1.0, 0.3963377774, 0.2158037573,
        1.0, -0.1055613458, -0.0638541728,
        1.0, -0.0894841775, -1.2914855480
    );
    vec3 rgb = lab * M2_inv;
    rgb *= rgb * rgb;
    return rgb * M1_inv;
}

float sawtooth(float t) {
    return abs(mod(t, 2. * pi) - pi) / pi * 2. - 1.;
}

float smoothnoiseb(float x) {
    return (((((sin(((x * 3.0) + 0.4)) + (sin((x * 7.8)) * 0.3)) + (sin(((x * 1.3) + (sin(x) * 3.0))) * 2.0)) + (sin((x * 1.3)) * 1.9)) + (sin((x / 2.0)) * 5.0)) / 10.2);
}

float base_flame(float x_1, float y, float t) {
    float yy = sqrt(y);
    float _e6 = smoothnoiseb((x_1 / 2.0));
    float inner_x = (x_1 + (_e6 * 4.0));
    float _e15 = smoothnoiseb(((x_1 / 3.0) - (t / 8.0)));
    float inner_y = sin((yy + (_e15 * 3.5)));
    float inner_time = (t / 4.0);
    float inner = ((inner_x + inner_y) + inner_time);
    return ((sin(inner) + 1.0) / 2.0);
}

vec3 flame(vec2 coord_logical, float color_time) {
    float v = base_flame((coord_logical.x / 2.0), coord_logical.y, in_time); // now
    float v2 = base_flame((coord_logical.x / 2.0), coord_logical.y, in_time + 10.); // 10s later
    float v3 = base_flame((coord_logical.x / 2.0), coord_logical.y, in_time - 10.); // 10s earlier
    // fade along vertical
    float b = clamp(
        v / (
            // start at 1
            1.0
            // decrease (divide) to 1/6*3 over 6 vertical units
            + smoothstep(0.0, 6.0, coord_logical.y/2.) * 3.
        ),
        0.0,
        1.0
    );

    return oklch(vec3(
            0.7, 
            (1.0
                // Decrease chroma slightly at peaks
                - pow(v, 0.5) * 0.5
            ) * 0.9 * 0.15, 
            // 180deg in 2m, 90deg in 1m
            color_time / 120. * 180.
                // shift the color by 20deg where the time shifted flames overlap
                - clamp(v2 + v3, 0., 1.) * 20.
        )) * b;
}

void main() {
    // BEGIN shared boilerplate
    vec2 height_norm = vec2(in_view_height_logical / in_reso.y);
    vec2 size_logical = in_reso * height_norm;
    vec2 coord_logical = gl_FragCoord.xy * height_norm;
    // END shared boilerplate

    float glass_margin = 0.15 * size_logical.y;

    vec4 glass = texture(in_tex_glass, gl_FragCoord.xy / in_reso);
    float glass_radius2 = glass.w;
    vec2 glass_towards_center = glass.xy;
    float glass_towards_center_pct_y = clamp(
        // Vertical percent across glass frame
        ((coord_logical.y + glass_towards_center.y) - glass_margin) / (size_logical.y - glass_margin * 2.),
        0.,
        1.
    );
    float glass_towards_center_dist2 = glass.z;

    vec3 base = flame(coord_logical, in_time);
    magic_fragColor = vec4(
        mix(
            // Normal color
            base, 
            // Glassified color
            flame(
                clamp(
                    // Glass color is sampled from the center
                    coord_logical
                    + mix(
                        vec2(0.),
                        glass_towards_center,
                        // Soften edge of glass by moving sampling back to original position
                        1. - glass_towards_center_dist2 / glass_radius2
                    ),
                    vec2(0.),
                    size_logical
                ),
                // Glass base color is sampled at same time as normal color
                in_time + 
                    // Periodically (sawtooth) - 300s for full cycle
                    sawtooth(in_time / 150. * pi)
                    // Shift color, with gradient with edges closer to original color
                    * (1. - glass_towards_center_dist2 / (glass_radius2 * 1.2))
                    // Up to 60deg
                    * 60.
            ),
            (
                true
                // Within glass frame
                && coord_logical.y > glass_margin && coord_logical.y < size_logical.y - glass_margin
                // Within circle radius
                && glass_towards_center_dist2 < glass_radius2
            ) ? 
                // Show glass
                max(
                    // Fade (blend with orig color) based on glass center height
                    pow(sin(glass_towards_center_pct_y * pi), 2.),
                    // Limit fade, make sure frame is clearly visible
                    in_glass_visible_min
                ) * in_glass_visible
            :
                0.
        ),
        0.
    );
}