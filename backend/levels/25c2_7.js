
module.exports = {

    MAP_FILE: '25c2_7',    // options are 'default_map' (DEFAULT), 'empty_map', 'map_20', ...files in levels/maps

    PARCELS_GENERATION_INTERVAL: '1s',  // options are '1s', '2s' (DEFAULT), '5s', '10s'
    PARCELS_MAX: 10,                    // 'infinite' (DEFAULT)

    MOVEMENT_DURATION: 100,             // default is 500
    AGENTS_OBSERVATION_DISTANCE: 10,     // default is 5
    PARCELS_OBSERVATION_DISTANCE: 7,    // default is 5

    PARCEL_REWARD_AVG: 50,              // default is 30
    PARCEL_REWARD_VARIANCE: 0,         // default is 10
    PARCEL_DECADING_INTERVAL: '1s',     // options are '1s', '2s', '5s', '10s', 'infinite' (DEFAULT)

    RANDOMLY_MOVING_AGENTS: 0,          // default is 2
    
    CLOCK: 50,  // default is 50 (50ms are 20frame/s)

}


