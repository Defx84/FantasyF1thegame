// Round to race name mapping for 2025 season
const ROUND_TO_RACE = {
    1: {
        name: 'australian',
        date: new Date('2025-03-16T05:00:00Z'),
        qualifyingStart: new Date('2025-03-15T05:00:00Z'),
        hasSprint: false
    },
    2: {
        name: 'chinese',
        date: new Date('2025-03-23T07:00:00Z'),
        qualifyingStart: new Date('2025-03-22T07:00:00Z'),
        hasSprint: true,
        sprintQualifyingStart: new Date('2025-03-21T07:00:00Z'),
        sprintStart: new Date('2025-03-22T07:00:00Z')
    },
    3: {
        name: 'japanese',
        date: new Date('2025-04-06T05:00:00Z'),
        qualifyingStart: new Date('2025-04-05T05:00:00Z'),
        hasSprint: false
    },
    4: {
        name: 'bahrain',
        date: new Date('2025-04-13T15:00:00Z'),
        qualifyingStart: new Date('2025-04-12T15:00:00Z'),
        hasSprint: false
    },
    5: {
        name: 'saudi-arabia',
        date: new Date('2025-04-20T17:00:00Z'),
        qualifyingStart: new Date('2025-04-19T17:00:00Z'),
        hasSprint: false
    },
    6: {
        name: 'miami',
        date: new Date('2025-05-04T19:30:00Z'),
        qualifyingStart: new Date('2025-05-03T19:30:00Z'),
        hasSprint: true,
        sprintQualifyingStart: new Date('2025-05-02T19:30:00Z'),
        sprintStart: new Date('2025-05-03T19:30:00Z')
    },
    7: {
        name: 'emilia-romagna',
        date: new Date('2025-05-18T13:00:00Z'),
        qualifyingStart: new Date('2025-05-17T13:00:00Z'),
        hasSprint: false
    },
    8: {
        name: 'monaco',
        date: new Date('2025-05-25T13:00:00Z'),
        qualifyingStart: new Date('2025-05-24T13:00:00Z'),
        hasSprint: false
    },
    9: {
        name: 'spanish',
        date: new Date('2025-06-01T13:00:00Z'),
        qualifyingStart: new Date('2025-05-31T13:00:00Z'),
        hasSprint: false
    },
    10: {
        name: 'canadian',
        date: new Date('2025-06-15T18:00:00Z'),
        qualifyingStart: new Date('2025-06-14T18:00:00Z'),
        hasSprint: false
    },
    11: {
        name: 'austrian',
        date: new Date('2025-06-29T13:00:00Z'),
        qualifyingStart: new Date('2025-06-28T13:00:00Z'),
        hasSprint: false
    },
    12: {
        name: 'british',
        date: new Date('2025-07-06T14:00:00Z'),
        qualifyingStart: new Date('2025-07-05T14:00:00Z'),
        hasSprint: false
    },
    13: {
        name: 'belgian',
        date: new Date('2025-07-27T13:00:00Z'),
        qualifyingStart: new Date('2025-07-26T13:00:00Z'),
        hasSprint: true,
        sprintQualifyingStart: new Date('2025-07-25T13:00:00Z'),
        sprintStart: new Date('2025-07-26T13:00:00Z')
    },
    14: {
        name: 'hungarian',
        date: new Date('2025-07-20T13:00:00Z'),
        qualifyingStart: new Date('2025-07-19T13:00:00Z'),
        hasSprint: false
    },
    15: {
        name: 'dutch',
        date: new Date('2025-08-24T13:00:00Z'),
        qualifyingStart: new Date('2025-08-23T13:00:00Z'),
        hasSprint: false
    },
    16: {
        name: 'italian',
        date: new Date('2025-08-31T13:00:00Z'),
        qualifyingStart: new Date('2025-08-30T13:00:00Z'),
        hasSprint: false
    },
    17: {
        name: 'azerbaijan',
        date: new Date('2025-09-14T11:00:00Z'),
        qualifyingStart: new Date('2025-09-13T11:00:00Z'),
        hasSprint: false
    },
    18: {
        name: 'singapore',
        date: new Date('2025-09-21T13:00:00Z'),
        qualifyingStart: new Date('2025-09-20T13:00:00Z'),
        hasSprint: false
    },
    19: {
        name: 'united-states',
        date: new Date('2025-10-19T19:00:00Z'),
        qualifyingStart: new Date('2025-10-18T19:00:00Z'),
        hasSprint: true,
        sprintQualifyingStart: new Date('2025-10-17T19:00:00Z'),
        sprintStart: new Date('2025-10-18T19:00:00Z')
    },
    20: {
        name: 'mexican',
        date: new Date('2025-10-26T20:00:00Z'),
        qualifyingStart: new Date('2025-10-25T20:00:00Z'),
        hasSprint: false
    },
    21: {
        name: 'brazilian',
        date: new Date('2025-11-09T17:00:00Z'),
        qualifyingStart: new Date('2025-11-08T17:00:00Z'),
        hasSprint: true,
        sprintQualifyingStart: new Date('2025-11-07T17:00:00Z'),
        sprintStart: new Date('2025-11-08T17:00:00Z')
    },
    22: {
        name: 'las-vegas',
        date: new Date('2025-11-23T06:00:00Z'),
        qualifyingStart: new Date('2025-11-22T06:00:00Z'),
        hasSprint: false
    },
    23: {
        name: 'qatar',
        date: new Date('2025-11-30T14:00:00Z'),
        qualifyingStart: new Date('2025-11-29T14:00:00Z'),
        hasSprint: true,
        sprintQualifyingStart: new Date('2025-11-28T14:00:00Z'),
        sprintStart: new Date('2025-11-29T14:00:00Z')
    },
    24: {
        name: 'abu-dhabi',
        date: new Date('2025-12-07T13:00:00Z'),
        qualifyingStart: new Date('2025-12-06T13:00:00Z'),
        hasSprint: false
    }
};

// Race name to round mapping for 2025 season
const RACE_TO_ROUND = Object.entries(ROUND_TO_RACE).reduce((acc, [round, race]) => {
    acc[race.name] = parseInt(round);
    return acc;
}, {});

// Helper function to get race name
const getRaceName = (round) => ROUND_TO_RACE[round]?.name;

// Helper function to check if race has sprint
const hasSprint = (round) => ROUND_TO_RACE[round]?.hasSprint || false;

// Helper function to get race date
const getRaceDate = (round) => ROUND_TO_RACE[round]?.date;

module.exports = {
    ROUND_TO_RACE,
    RACE_TO_ROUND,
    getRaceName,
    hasSprint,
    getRaceDate
}; 