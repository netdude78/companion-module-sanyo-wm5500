# Sanyo WM5500 Projector Control

This module connects to a Sanyo WM5500 Projector via Telnet on tcp/10000. It has been tested with:
* Sanyo WM5500

It may work with other Sanyo projectors

## Available Actions
* Projector Power-On
* Projector Power-Off
* Video Mute
* Video Un-Mute

## Available Feedback
* Current projector status

## Command Set:
* "C00" - Power ON
* "C01" - Power OFF
* "C0D" - Video mute ON
* "C0E" - Video mute OFF

* "CR0" - Inquire Status (also used as heartbeat to keep telnet alive)
Return Codes:
* 00 - Power On
* 20 - Cooling Down
* 40 - Countdown (power up warming up)
* 80 - Standby (projector off)