const util = require('util');
const path = require('path');
const _ = require('lodash');

const fs = require('fs');
const readFileAsync = util.promisify(fs.readFile);
const assetsPath = path.join(__dirname, 'assets');

async function main() {

    let data = await loadData();
    // console.log(JSON.stringify(data));

    let initialState = {
        population: { Engineers: 10000 }
    };

    let finalState = run(data, initialState);
    console.log(JSON.stringify(finalState, null, 2));

    let totalPopulation = _.sum(Object.keys(finalState.population).map(level => finalState.population[level] * data.houses[level]));
    console.log('Total Population:', totalPopulation);

    let populationPerHouse = totalPopulation / _.sum(Object.values(finalState.population));
    console.log('Population per House:', populationPerHouse);

}

function step(data, state) {

    let surplus = {};

    // consumption
    for(let good in data.production) {

        var demand = 0;
        for(let level in state.population) {
            if(good in data.population[level]) {
                demand += state.population[level] * data.population[level][good];
            }
        }
        for(let output in data.production) {
            if(data.production[output].inputs.includes(good)) {
                demand += state.production[output] / data.production[output].time;
            }
        }
        if(demand === 0) continue;
        var factories = demand * data.production[good].time;
        if(state.production[good] < factories) {
            console.log('need ' + factories + ' ' + good);
            state.production[good] = factories;
        }

    }

    // production
    for(let level in data.population) {

        var workers = 0;
        for(let good in state.production) {
            workers += data.workers[good][level] * Math.ceil(state.production[good]);
        }
        let houses = Math.ceil(workers / data.houses[level]);
        if(state.population[level] < houses) {
            console.log('need ' + houses + ' ' + level);
            state.population[level] = houses;
        }
        surplus[level] = state.population[level] * data.houses[level] - workers;

    }

    return surplus;

}

function run(data, state) {

    state = _.merge({
        population: _.mapValues(data.population, (v, k) => 0),
        production: _.mapValues(data.production, (v, k) => 0),
    }, state);

    while(true) {
        var newState = _.cloneDeep(state);
        let surplus = step(data, newState);
        console.log(JSON.stringify(surplus));
        if(_.isEqual(state, newState))
            break;
        state = newState;
    }


    for(let level in state.population) {
        if(state.population[level] === 0)
            delete state.population[level];
        else
            state.population[level] = Math.ceil(state.population[level]);
    }

    for(let good in state.production) {
        if(state.production[good] === 0)
            delete state.production[good];
        else
            state.production[good] = Math.ceil(state.production[good]);
    }

    return state;

}

function prune(obj) {
    for(let key in obj) {
        if(obj[key] === 0)
            delete obj[key];
    }
}

async function loadData(withLuxuryGoods = false) {

    let data = {};
    
    let products = await readFileAsync(path.join(assetsPath, 'products.json'))
        .then(JSON.parse)
        .then(p => p.reduce((obj, e) => {
            obj[e.ID] = e.Name;
            return obj;
        }, {}));

    data.population = await readFileAsync(path.join(assetsPath, 'population.json'))
        .then(JSON.parse)
        .then(p => p.reduce((obj, e) => {
            obj[e.Name] = e.Inputs.reduce((obj2, e2) => {
                if(!withLuxuryGoods && e2.SupplyWeight === 0) return obj2;
                let productName = products[e2.ProductID.toString()];
                obj2[productName] = e2.Amount;
                return obj2;
            }, {});
            return obj;
        }, {}));

    data.production = await readFileAsync(path.join(assetsPath, 'production.json'))
        .then(JSON.parse)
        .then(p => p.reduce((obj, e) => {
            if(e.Outputs.length == 0) return obj;
            let product = e.Outputs[0];
            let productName = products[product.ProductID.toString()];
            obj[productName] = {
                time: e.CycleTime === 0 ? 30 : e.CycleTime,
                inputs: e.Inputs.map(e2 => products[e2.ProductID.toString()])
            };
            return obj;
        }, {}));

    data.workers = await readFileAsync(path.join(assetsPath, 'workers.json'))
        .then(JSON.parse);

    data.houses = await readFileAsync(path.join(assetsPath, 'houses.json'))
        .then(JSON.parse);

    return data;
}

main().catch(console.error);