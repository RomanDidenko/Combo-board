This firmware allows you to create a device with a flexible configuration of inputs and outputs.

The device with this firmware also works as a router.

Options
=========================

Remember state - The firmware saves the output state to NVRAM and restores it after power off/on.

Link - The input immediately controls the state of the corresponding output. The device sends the on/off state of
the output to a coordinator. Otherwise, the input is independent.

Long - The firmware detects and reports to the coordinator a long click (2000 ms)

Double - The firmware detects and reports double click (max 500 ms between clicks)

Tripple - The firmware detects and reports tripple click (max 500 ms between clicks)

Switch - an input works as a switch. Only ON (pushed) / OFF (released) states.


UART
=========================

The UART interface is designed to send text commands between an external device (e.g. Arduino) and a host. 

The maximum command size is 127 characters. Every command line should ends with CR (0x0D). If you need 
to send a number to a host, you should convert it to text.

UART uses P02 and P03 pins (3.3V). You should enable UART on one of output pins in the configuration.

UART parameters: 9600 8N1. You cannot change these parameters.

External sensors 
=========================

The firmware supports up to 8 external sensors of different types. 
Keep in mind, that CC253x has limited performance. You cannot attach 8 sensors, 4 inputs, UART and get a good result.
Some sensors cannot co-exist with each other.

I2C sensors (BMx280, SI7021, etc)
---
You should define a pin for a sensor first. It is the SDA pin. Then you should define the SCL pin. 
For example, output 7 - BME280, and output 8 - I2C SCL

DS18B20
---
The firmware supports up to 4 sensors on one line. But all values will be sent to one endpoint with a different description.

Pulse generator
---
You may use this generator to wake-up Atmega based sensor. That should measure a value and output it to an UART port.

Pulse counter
---
It is 32 bit counter with the 10 milliseconds debounce interval. Therefore it cannot be used for high frequence signals.
If an interval is defined, the counter automatically resets after that interval and reports the counted values to a coordinator.

MHZ19, Senseair
---
These sensors should work in the UART mode and connected to UART pins. Therefore you cannot use the UART interface in the same
configuration. (CC2530 P0.2 -> MH-Z19 RX, CC2530 P0.3 -> MH-Z19 TX)


Bistable relay
==========================

You should define ON pin first. For example, output 7 - Bistable relay ON, and output 8 - Bistable relay OFF


Analog inputs
==========================

You may define up to 8 analog inputs in the configuration. You can connect analog inputs to pins P00..P07.

Analog input, accurate (max 1.15V) - the pin uses internal reference voltage that is more precise than an source voltage.
Analog input, (max 3.3V) - less accurate, but it can measure higher voltage.
Source voltage - reports source power voltage. It can be used to monitor a battery level.
Internal temperature - reports a temperature of the CC2530 chips.

The firmware reads analog values when it sends a periodic report to a host. When the periodic report is disabled you should
send the "read" request for the configured endpoint.

Experts options
==========================

You should know what you change.


Zigbee internals
=========================

1. The firmware creates a separate endpoint (1..8) for every configured output and/or input (max 8 endpoints).

2. The firmware reports the state of an independent button via the "ZCL_CLUSTER_ID_GEN_MULTISTATE_INPUT_BASIC" cluster 
   and the "PRESENT_VALUE" attribute.

   1 - single click.
   2 - double click.
   3 - tripple click.
   4 - long click.

4. The firmware does not send a separate report for the linked button. Otherwise, it sends reports about the output state 
  via the "ZCL_CLUSTER_ID_GEN_ON_OFF" cluster and the "ON_OFF" attribute.
  
5. You may control the output state via the "ZCL_CLUSTER_ID_GEN_ON_OFF" cluster and the "ON_OFF" attribute.

  In zigbee2mqtt you may write ON or OFF to:
  
  Output 1: zigbee2mqtt/[FRIENDLY_NAME]/l1/set
  Output 2: zigbee2mqtt/[FRIENDLY_NAME]/l2/set
  Output 3: zigbee2mqtt/[FRIENDLY_NAME]/l3/set
  Output 4: zigbee2mqtt/[FRIENDLY_NAME]/l4/set
  Output 5: zigbee2mqtt/[FRIENDLY_NAME]/l5/set
  
  or read data using the MQTT topic like:
  
  zigbee2mqtt/[FRIENDLY_NAME]/l1/get
  
  also you may use l1 ... l8 for the corresponding channel.

  
6. The "ZCL_CLUSTER_ID_GEN_ON_OFF" cluster also accepts the "read", "configure" and "onOffWithTimedOff" commands:

  "read" - returns the current state on the specified endpoint.
  "configure" - set the periodic reporting interval for the output. The "minReportInt" attribute specifies the reporting interval
   in seconds. If "minReportInt" is 65535, the firmware disables periodic reports.     
  "onOffWithTimedOff" - sets the output state to "HIGH" for "onTime" milliseconds, and automatically resets to "LOW".

7. The "ZCL_CLUSTER_ID_GEN_MULTISTATE_VALUE_BASIC" cluster is used to send and receive UART data.
  The cluster accepts the "write" command with the "stateText" attribute. The firmware outputs the content of the attribute 
  to UART and appends CR (0xOD). If the firmware receives a command from UART, it sends data to a host immediately.
  
  In zigbee2mqtt, you may send text data to UART data through MQTT topic:
  
  zigbee2mqtt/[FRIENDLY_NAME]/set/action
  
  or send hex data in the JSON format {"action": [4,3,2,1,0]} to 

  zigbee2mqtt/[FRIENDLY_NAME]/set
  
  Zigbee2MQTT publishes data from UART to the topic zigbee2mqtt/[FRIENDLY_NAME] in the JSON format.

  {..... "action": "your_data" ....} 
  
  If you do not receive data from UART, you should check that data contains CR (0x0D) at the end of a data packet.
  

8. The "ZCL_CLUSTER_ID_GEN_ANALOG_INPUT_BASIC" cluster accepts the "read" command. The firmware immediately reads an ADC value and returns 
to a host.

  In zigbee2mqtt you may read data through MQTT:
  
  zigbee2mqtt/[FRIENDLY_NAME]/get/l1
  ...
  zigbee2mqtt/[FRIENDLY_NAME]/get/l8

  or
  zigbee2mqtt/[FRIENDLY_NAME]/l1/get/l1
  
9. PWM

ZCL_CLUSTER_ID_GEN_LEVEL_CONTROL

MQTT topic: zigbee2mqtt/[FRIENDLY_NAME]/l4/set
MQTT payload: {"brightness": 1, "transition": 3}

MQTT topic: zigbee2mqtt/[FRIENDLY_NAME]/l4/set/brightness
MQTT payload: brightness value (0-254)

MQTT topic: zigbee2mqtt/[FRIENDLY_NAME]/l4/get/brightness
MQTT payload: none


cc2530-cc2590.hex
=========================
The firmware is compiled for a particular version of the CC2530 board with the additional CC2590/RFX2401 RF chip.

cc2530-cc2591-xxxxx.hex
=========================
The firmware is compiled for a particular version of the CC2530 board with the additional CC2591 RF chip.
Note: The CC2591 RF chip is connected to CC2530 through P11 (PAEN), P14 (EN) and P07 (HGM) pins.
This is the generally used layout.

cc2530-cc2591-hexin-dl22-xxxxx.hex
=========================
The firmware is compiled for a particular version of the CC2530 board with the additional CC2591 RF chip.
Note: The CC2591 RF chip is connected to CC2530 through P14 (PAEN), P15 (EN) and P07 (HGM) pins. This is the proprietary layout!
Links: 
http://www.hexin-technology.com/1000m_TTL_to_ZigBee_Module-Product-566.html
https://ru.aliexpress.com/item/2-4G-Zigbee-Wireless-Transceiver-Module-Long-Distance-Wireless-Serial-Transceiver-Module/32703502764.html

cc2530-cc2592-xxxxx.hex
=========================
The firmware is compiled for a particular version of the CC2530 board with the additional CC2592 RF chip.


Lights
=========================

If the LED pin is configured.

Short fast blinks (one per second) – the router is connecting to a network.
Short long blinks (one per 4 seconds) – normal operations.
Three short blinks – the router cannot send a report to a coordinator.


Pairing
=========================
Flash firmware and permit joining to a network on your coordinator.


Re-pairing
=========================
Power on, wait 2 seconds, power off, repeat this cycle three times.

If you configured first input pin, click and hold it for 10 seconds.

-------------------
More info: https://ptvo.info/zigbee-configurable-firmware-features/
Download: https://ptvo.info/zigbee-switch-configurable-firmware-v2-210/
Home page: https://ptvo.info