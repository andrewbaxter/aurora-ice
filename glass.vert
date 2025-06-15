#version 300 es

uniform float in_view_height_logical;
// Used to reduce overdraw, but shouldn't really matter at this scale; also affects 
// density (smaller radius = smaller buffer = more dense)
uniform float in_glass_max_radius;
uniform float in_time;
uniform vec2 in_reso;

in vec2 in_vert;
in vec2 in_start;
in vec2 in_vel;
in float in_radius2;

out highp vec2 send_center;
out highp float send_radius2;

void main() {
    // BOILERPLATE
    vec2 height_norm = vec2(in_view_height_logical / in_reso.y);
    vec2 size_logical = in_reso * height_norm;
    // END BOILERPLATE

    // Passed through to main stage
    send_radius2 = in_radius2;

    // Randomly across screen + buffer of radius.
    // Wrap to that area due to movement.
    // The buffer prevents wrapping voronoi effects from spreading to the visible area
    send_center = mod(
        in_start * (size_logical + 2. * in_glass_max_radius)
        + (in_vel - 0.5) * vec2(5. / 17., 1. / 17.) * in_time,
        size_logical + 2. * in_glass_max_radius
    ) - in_glass_max_radius;

    // Convert back to -1..1 range for stage
    gl_Position = vec4((send_center + in_vert * in_glass_max_radius) / size_logical * 2. - 1., 0.0, 1.0);
}