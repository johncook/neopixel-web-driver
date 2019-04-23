A quick and dirty neopixel driver for Raspberry PI.

When started, the driver lights the specified (default 8) number of LEDS
and waits for a connected request. 

http://localhost:3000/fail
  Enters the "FAILED" state. When called, all the LEDS should light 'RED'
  and stay in that state. This mode can be exited by calling a `connected`
  request.

localhost:3000/connected
  Enters the "CONNECTED" state. When called, the LEDS should turn 'GREEN'
  for one second, the it enters "LISTENING" mode.

http://localhost:3000/{led}/{red}/{green}/{blue}
  When in "LISTENING" mode, sets the specified LED (zero indexed) to the
  color specified by the red, green, and blue components. The LED will
  then flash the specified color.

  The color components should be in the range 0 - 255.

Attract Mode
  If the device is in "LISTENING" mode and  no LED data is recieved for a
  few seconds, the driver enters "ATTRACT" mode. This lights the LEDs in
  sequence.

  If mode LED data is recieved, "ATTRACT" mode exits and the driver returns
  to "LISTENING" mode.

