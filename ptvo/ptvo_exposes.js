const zigbeeHerdsmanConverters = require('zigbee-herdsman-converters');

const exposes = zigbeeHerdsmanConverters.exposes;
const ea = exposes.access;
const e = exposes.presets;
const fz = zigbeeHerdsmanConverters.fromZigbeeConverters;
const tz = zigbeeHerdsmanConverters.toZigbeeConverters;

const ptvo_switch = zigbeeHerdsmanConverters.findByDevice({modelID: 'ptvo.switch'});
fz.legacy = ptvo_switch.meta.tuyaThermostatPreset;

const device = {
    zigbeeModel: ['_model_'],
    model: '_model_',
    vendor: 'Custom devices (DiY)',
    description: '[Configurable firmware](https://ptvo.info/zigbee-configurable-firmware-features/)',
    fromZigbee: [_fromZigbee_],
    toZigbee: [_toZigbee_],
    exposes: [_exposes_],
    meta: {
        multiEndpoint: true,
        _meta_
    },
    endpoint: (device) => {
        return {
            _endpoint_
        };
    },
    _extra_
};

module.exports = device;