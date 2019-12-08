const $ = require('jquery');

/**
 * Displayed text when villager is awake.
 * @type {string}
 */
const AWAKE_TEXT = "Awake";

/**
 * Displayed text when villager is asleep.
 * @type {string}
 */
const ASLEEP_TEXT = "Asleep";

/**
 * Relation of personality and city ordinance with awake/sleeping times in New Leaf.
 * @type {{}}
 */
const newLeafSleepTimes = {
    "cranky" : {
        "normal" : {
            "wake" : 600,
            "sleep" : 240
        },
        "earlyBird" : {
            "wake" : 480,
            "sleep" : 240
        },
        "nightOwl" : {
            "wake" : 600,
            "sleep" : 360
        }
    },
    "jock" : {
        "normal" : {
            "wake" : 420,
            "sleep" : 0
        },
        "earlyBird" : {
            "wake" : 360,
            "sleep" : 0
        },
        "nightOwl" : {
            "wake" : 420,
            "sleep" : 150
        }
    },
    "lazy" : {
        "normal" : {
            "wake" : 540,
            "sleep" : 1380
        },
        "earlyBird" : {
            "wake" : 450,
            "sleep" : 1380
        },
        "nightOwl" : {
            "wake" : 540,
            "sleep" : 90
        }
    },
    "normal" : {
        "normal" : {
            "wake" : 360,
            "sleep" : 0
        },
        "earlyBird" : {
            "wake" : 300,
            "sleep" : 0
        },
        "nightOwl" : {
            "wake" : 360,
            "sleep" : 120
        }
    },
    "peppy" : {
        "normal" : {
            "wake" : 540,
            "sleep" : 60
        },
        "earlyBird" : {
            "wake" : 420,
            "sleep" : 60
        },
        "nightOwl" : {
            "wake" : 630,
            "sleep" : 180
        }
    },
    "smug" : {
        "normal" : {
            "wake" : 510,
            "sleep" : 120
        },
        "earlyBird" : {
            "wake" : 420,
            "sleep" : 120
        },
        "nightOwl" : {
            "wake" : 510,
            "sleep" : 210
        }
    },
    "snooty" : {
        "normal" : {
            "wake" : 570,
            "sleep" : 120
        },
        "earlyBird" : {
            "wake" : 480,
            "sleep" : 120
        },
        "nightOwl" : {
            "wake" : 570,
            "sleep" : 240
        }
    },
    "uchi" : {
        "normal" : {
            "wake" : 660,
            "sleep" : 180
        },
        "earlyBird" : {
            "wake" : 570,
            "sleep" : 180
        },
        "nightOwl" : {
            "wake" : 660,
            "sleep" : 330
        }
    }
}

/**
 * Relation of personality to waking/sleeping time in Wild World and City Folk.
 * @type {{}}
 */
const wildWorldCityFolkSleepTimes = {
    "cranky" : {
        "wake" : 600,
        "sleep" : 270
    },
    "jock" : {
        "wake" : 390,
        "sleep" : 120
    },
    "lazy" : {
        "wake" : 480,
        "sleep" : 90
    },
    "normal" : {
        "wake" : 300,
        "sleep" : 60
    },
    "peppy" : {
        "wake" : 420,
        "sleep" : 150
    },
    "snooty" : {
        "wake" : 540,
        "sleep" : 210
    }
}

/**
 * Relation of personality to waking/sleeping time in all games before Wild World.
 * @type {{}}
 */
const animalForestSleepTimes = {
    "cranky" : {
        "wake" : 600,
        "sleep" : 300
    },
    "jock" : {
        "wake" : 330,
        "sleep" : 60
    },
    "lazy" : {
        "wake" : 480,
        "sleep" : 1320
    },
    "normal" : {
        "wake" : 300,
        "sleep" : 1260
    },
    "peppy" : {
        "wake" : 420,
        "sleep" : 1410
    },
    "snooty" : {
        "wake" : 540,
        "sleep" : 180
    }
}

/**
 * Current user's time.
 * @type {Date}
 */
const time = new Date();

/**
 * Current user's time, in minutes since midnight.
 * @type {number}
 */
const userTime = (time.getHours() * 60) + time.getMinutes();

$(document).ready(function () {
    // Get personalities and compute data if existing.
    const personalityMap = $("#personality-data").data("personality");
    if (typeof personalityMap !== 'undefined') {
        // Compute villager's sleep status and generate jQuery object to be appended.
        const sleepTable = generateSleepTable(personalityMap);
        $(".sleep-table").append(sleepTable);
    }
});

/**
 * Builds the schedule table and returns it as a jQuery object.
 *
 * @param personalityMap the mapping of personality to game for this villager.
 * @returns {*|jQuery|undefined}
 */
function generateSleepTable(personalityMap) {
    // Get the sleep status first.
    const sleepStatus = getSleepStatus(personalityMap);

    // Now we can build the table from it.
    const sleepTable = $('<table/>')
        .attr('class', 'table table-borderless mt-3');
    sleepTable.append($('<thead/>')
        .attr('class', 'bg-dark text-light')
        .append($('<tr/>')
            .append($('<th/>')
                .attr('colspan', 2)
                .text('Schedule'))));
    const tbody = $('<tbody/>');

    const tdClass = "bg-light text-dark font-weight-bold";

    if (sleepStatus['NL']) {
        tbody.append($('<tr/>')
            .append($('<td/>')
                .attr('class', tdClass)
                .text('New Leaf (Regular)'))
            .append($('<td/>')
                .text(sleepStatus['NL'])));
        tbody.append($('<tr/>')
            .append($('<td/>')
                .attr('class', tdClass)
                .text('New Leaf (Early Bird)'))
            .append($('<td/>')
                .text(sleepStatus['earlyBirdNL'])));
        tbody.append($('<tr/>')
            .append($('<td/>')
                .attr('class', tdClass)
                .text('New Leaf (Night Owl)'))
            .append($('<td/>')
                .text(sleepStatus['nightOwlNL'])));
    }

    if (sleepStatus['WWCF']) {
        tbody.append($('<tr/>')
            .append($('<td/>')
                .attr('class', tdClass)
                .text('Wild World/City Folk'))
            .append($('<td/>')
                .text(sleepStatus['WWCF'])));
    }

    if (sleepStatus['ACAF']) {
        tbody.append($('<tr/>')
            .append($('<td/>')
                .attr('class', tdClass)
                .text('Animal Crossing'))
            .append($('<td/>')
                .text(sleepStatus['ACAF'])));
    }

    sleepTable.append(tbody);
    return sleepTable;
}

/**
 * Returns AWAKE_STATUS or SLEEP_STATUS text depending on input.
 *
 * @param sleepTime the time the villager goes to sleep, in minutes since midnight
 * @param wakeTime the time the villager wakes up, in minutes since midnight
 * @param userTime the current user's time, in minutes since midnight
 * @returns {string}
 */
function determineSleepStatus(sleepTime, wakeTime, userTime) {
    let result;
    if (sleepTime > wakeTime) {
            result = ASLEEP_TEXT;
        if (wakeTime < userTime && userTime < sleepTime) {
            result = AWAKE_TEXT;
        }
    } else {
        result = AWAKE_TEXT;
        if (sleepTime < userTime && userTime < wakeTime) {
            result = ASLEEP_TEXT;
        }
    }
    return result;
}

/**
 * Returns sleep status object for the given personality to game map for this villager.
 *
 * @param personalityMap
 * @returns {{}}
 */
function getSleepStatus(personalityMap) {
    let sleepStatus = {};

    personalityMap.forEach(function(entry) {
        let shortTitle = entry['shortTitle'];
        let personality = entry['value'];

        let sleepTime;
        let wakeTime;

        if (shortTitle === "NL") {
            // New Leaf Normal Sleep Times
            sleepTime = newLeafSleepTimes[personality]['normal']['sleep'];
            wakeTime = newLeafSleepTimes[personality]['normal']['wake'];
            sleepStatus['NL'] = determineSleepStatus(sleepTime, wakeTime, userTime);

            // New Leaf Early Bird Sleep Times
            sleepTime = newLeafSleepTimes[personality]['earlyBird']['sleep'];
            wakeTime = newLeafSleepTimes[personality]['earlyBird']['wake']
            sleepStatus['earlyBirdNL'] = determineSleepStatus(sleepTime, wakeTime, userTime);

            // New Leaf Night Owl Sleep Times
            sleepTime = newLeafSleepTimes[personality]['nightOwl']['sleep'];
            wakeTime = newLeafSleepTimes[personality]['nightOwl']['wake']
            sleepStatus['nightOwlNL'] = determineSleepStatus(sleepTime, wakeTime, userTime);
        } else if (shortTitle === "CF") {
            // City Folk and Wild World Sleep Times
            sleepTime = wildWorldCityFolkSleepTimes[personality]['sleep'];
            wakeTime = wildWorldCityFolkSleepTimes[personality]['wake']
            sleepStatus['WWCF'] = determineSleepStatus(sleepTime, wakeTime, userTime);
        } else if (shortTitle === "AFe+") {
            // AC GameCube and Animal Forest Sleep Times
            sleepTime = animalForestSleepTimes[personality]['sleep'];
            wakeTime = animalForestSleepTimes[personality]['wake']
            sleepStatus['ACAF'] = determineSleepStatus(sleepTime, wakeTime, userTime);
        }
    });

    return sleepStatus;
}