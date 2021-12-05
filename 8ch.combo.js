const zigbeeHerdsmanConverters = require('zigbee-herdsman-converters');

const utils = require('zigbee-herdsman-converters/lib/utils');

const exposes = zigbeeHerdsmanConverters.exposes;
const ea = exposes.access;
const e = exposes.presets;
const fz = zigbeeHerdsmanConverters.fromZigbeeConverters;
const tz = zigbeeHerdsmanConverters.toZigbeeConverters;

const ptvo_switch = zigbeeHerdsmanConverters.findByDevice({modelID: 'ptvo.switch'});
fz.legacy = ptvo_switch.meta.tuyaThermostatPreset;

const custom_converters = {
    from_AnalogInput : {
        cluster: 'genAnalogInput',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const payload = fz.ptvo_switch_analog_input.convert(model, msg, publish, options, meta);
            const channel = msg.endpoint.ID;
            const name = `l${channel}`;
            
            if(channel === 1) {
                const  value = parseInt(msg.data['presentValue'], 10);

                // https://prog-cpp.ru/mnk/
                // x (V): 0 5 15 857 858 1003 814
                // Y (analog values): 0 0.015 0.033 1.373 1.374 1.606 1.304
                // y = 0.0016016716845 * x
                /*
                    void Main()
                    {
                        var x = new decimal[] {0, 5, 15, 857, 858, 1003, 814};
                        var y = new decimal[] {0, 0.015m, 0.033m, 1.373m, 1.374m, 1.606m, 1.304m};

                        var a = x.Zip(y, (first,second)=> first * second).Sum() / x.Select(xx=> xx*xx).Sum();
                        a.Dump();
                    }
                */

                var v = utils.precisionRound(0.0016016716845 * value , 3);
                payload[`analog_voltage_${name}`] = v;

                // https://wiki.dfrobot.com/Gravity__Analog_TDS_Sensor___Meter_For_Arduino_SKU__SEN0244
                // temperature compensation formula: fFinalResult(25C) = tds(current C)/(1.0 + 0.02 * (t - 25.0))
                // tds = (133.42 * v*v*v - 255.86 * v*v + 857.39 * v) * 0.5
                payload[`tds_${name}`] = utils.precisionRound((133.42 * v*v*v - 255.86 * v*v + 857.39 * v) * 0.5, 0);
                
                //meta.logger.warn(`CH ${JSON.stringify(msg)}`);
            }
            
            return payload;
        }
    },
    to_Analog_Input: {
        key: ['tds', 'analog_voltage'],
        convertGet: async (entity, key, meta) => {
            const epId = parseInt(meta.endpoint_name.substr(1, 2));

            if (utils.hasEndpoints(meta.device, [epId])) {
                const endpoint = meta.device.getEndpoint(epId);
                await endpoint.read('genAnalogInput', ['presentValue', 'description']);
            }
        }
    }
}

const device = {
    zigbeeModel: ['8ch.combo'],
    model: '8ch.combo',
    vendor: 'Custom devices (DiY)',
    description: '[Configurable firmware](https://ptvo.info/zigbee-configurable-firmware-features/)',
    fromZigbee: [fz.ignore_basic_report, custom_converters.from_AnalogInput/*fz.ptvo_switch_analog_input, fz.ptvo_multistate_action, fz.legacy.ptvo_switch_buttons,*/],
    toZigbee: [custom_converters.to_Analog_Input, tz.ptvo_switch_analog_input],//[tz.ptvo_switch_trigger, tz.ptvo_switch_analog_input,],
    exposes: [
        exposes.numeric('tds', ea.STATE_GET).withDescription('TDS').withUnit('ppm').withEndpoint('l1'),
        exposes.numeric('analog_voltage', ea.STATE_GET).withDescription('Analog read voltage').withUnit('V').withEndpoint('l1'),
        exposes.numeric('l1', ea.STATE_GET).withDescription('ADC raw value'),
        e.cpu_temperature().withProperty('temperature').withEndpoint('l2'),
        e.voltage().withAccess(ea.STATE).withEndpoint('l3'),
        exposes.numeric('l4', ea.STATE).withDescription('Uptime (seconds)'),
        //e.action(['single', 'double', 'triple', 'hold', 'release']),
],
    meta: {
        multiEndpoint: true
    },
    endpoint: (device) => {
        return {
            l1: 1, l2: 2, l3: 3, l4: 4 //, l5: 5, l6: 6, l7: 7, l8: 8,
        };
    },
    
};

module.exports = device;
