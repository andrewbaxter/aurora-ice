#version 300 es

precision highp float;
precision highp int;

uniform float in_view_height_logical;
uniform vec2 in_reso;

in highp vec2 send_center;
in highp float send_radius2;

layout (location=0) out highp vec4 magic_fragColor;

void main() {
    // BOILERPLATE
    vec2 height_norm = vec2(in_view_height_logical / in_reso.y);
    // END BOILERPLATE

    vec2 diff = send_center - gl_FragCoord.xy * height_norm;
    float dist2 = diff.x * diff.x + diff.y * diff.y;
    // Must go between 0-1 for stage; 100 gives enough precision (and mistakes wouldn't be visible anyways)
    gl_FragDepth = dist2 / 100.;
    magic_fragColor = vec4(
        diff,
        dist2,
        // Pass through to main shader as alpha
        send_radius2
    );
}