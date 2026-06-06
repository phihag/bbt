var NRW2016_RE = /^NRW-(O19)-(?:(?:([NS])([12]))-|GW-)?([A-Z]{2})-([0-9]{3})-(?:2016|2017)$/;
function name_by_league(league_key) {
    if (is_bundesliga(league_key)) {
        if (/^1BL-/.test(league_key)) {
            return '1. Bundesliga';
        }
        if (/^2BLN-/.test(league_key)) {
            return '2. Bundesliga Nord';
        }
        if (/^2BLS-/.test(league_key)) {
            return '2. Bundesliga Süd';
        }
    }
    if (league_key === 'OBL-2017') {
        return 'ÖBV-Bundesliga'; // Österreich
    }
    if (league_key === 'RLN-2016') {
        return 'Regionalliga Nord';
    }
    if (league_key === 'RLM-2016') {
        return 'Regionalliga Mitte';
    }
    if (league_key === 'NLA-2017') {
        return 'NLA';
    }
    if (league_key === 'NLA-2019') {
        return 'NLA';
    }
    if (league_key === 'international-2017') {
        return 'International match';
    }
    if (league_key === 'RLSO-2019') {
        return 'Regionalliga SüdOst';
    }
    if (league_key === 'RLSOO-2017') {
        return 'Regionalliga SüdOst Ost';
    }
    if (league_key === 'RLSOS-2017') {
        return 'Regionalliga SüdOst Süd';
    }
    if (league_key === 'OLSW-2020') {
        return 'Oberliga Südwest';
    }
    if (league_key === 'OLM-2020') {
        return 'Oberliga Mitte';
    }

    if (league_key === 'RLW-2016') {
        league_key = 'NRW-O19-RL-001-2016';
    }

    var m = NRW2016_RE.exec(league_key);
    if (m) {
        var league_name = {
            'RL': 'Regionalliga',
            'OL': 'NRW-Oberliga',
            'VL': 'Verbandsliga',
            'LL': 'Landesliga',
            'BL': 'Bezirksliga',
            'BK': 'Bezirksklasse',
            'KL': 'Kreisliga',
            'KK': 'Kreisklasse',
        }[m[4]];

        var location_name;
        if (m[4] === 'RL') {
            location_name = 'West';
        } else if (m[4] === 'OL') {
            location_name = (m[5] === '002') ? 'Nord' : 'Süd';
        } else {
            location_name = {
                'N': 'Nord',
                'S': 'Süd',
            }[m[2]];
            if (location_name) {
                location_name += ' ' + m[3];
            } else {
                location_name = m[2] + ' ' + m[3];
            }
        }

        if (!league_name) {
            return league_key;
        }

        return league_name + ' ' + location_name + ' (' + m[5] + ')';
    }

    return league_key;
}

function is_bundesliga(league_key) {
    return /^(?:1BL|2BLN|2BLS)-/.test(league_key);
}


function pluck(obj, keys) {
    var res = {};
    keys.forEach(function(k) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
            res[k] = obj[k];
        }
    });
    return res;
}

module.exports = {
    pluck,
    name_by_league,
};
