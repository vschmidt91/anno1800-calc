# ANNO 1800 Production and Population Calculator

Tool to calculate production and population required to satisfy inhabitants.
Per default, only essential goods will be provided.
All population numbers are in houses (not inhabitants).
Given some initial state, e.g.

~~~~
{ population: { Workers: 100 } }
~~~~

it will iteratively

1. add production to satisfy the population's need
2. add population to provide workforce for the production

until a fixpoint is reached, i.e. all needs are satisfied and all productions have enough workers, e.g.

~~~~
{
  "population": {
    "Workers": 100,
    "Farmers": 48
  },
  "production": {
    "Work Clothes": 4,
    "Flour": 1,
    "Tallow": 1,
    "Sausages": 3,
    "Bread": 2,
    "Soap": 1,
    "Fish": 4,
    "Pigs": 3,
    "Wool": 4,
    "Grain": 2
  }
}
~~~~

# Installation and Usage

requires NodeJS (https://nodejs.org/en/download/)

run the following in the package's folder:

`npm install`
`npm start`
