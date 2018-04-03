# service-path

service-path is a Node library for mapping service input/ouput connections on a graph and deducing optimal routes for service traversal to achieve a desired output from any given inputs

### Installation
(requires [Node.js](https://nodejs.org/) v4+)
```sh
$ npm install service-path
```

# Examples

### A simple graph with no services

This is a very simple example only useful for demonstration purposes, where we set up two input types: ```first_name``` and ```last_name``` and assigned them values.

```js
const servicePath = require('service-path');

let inputs = {
    first_name: 'john',
    last_name: 'smith'
};

let outputType = 'first_name';

servicePath.getAndExecuteServicePath(inputs, outputType)
    .then((output) => {
        console.log(output);
    });
```

Then we asked service-path to try deduce the optimal path using all it knows to get us the value for ```first_name``` (which was already set). So when you execute the script it just returns the value:
```sh
john
```

### A simple graph with a single function service

Now for a slightly more interesting example, we'll add a function service that will create a ```full_name``` from a ```first_name``` and a ```last_name```.

We'll need two more files, a services registry file which we'll name ```example_registry.json```

```json
{
    "full_name" : {
        "type": "function",
        "input": [
            "first_name",
            "last_name"
        ],
        "output": "full_name"
    }
}
```

and a function services file which we'll name ```example_functions.js```

```js
module.exports['full_name'] = (first_name, last_name) => {
    return first_name + ' ' + last_name;
}
```
then in our script we register the registry and the functions script via the ```servicePath.setup``` function.

```js
const servicePath = require('service-path');

servicePath.setup({
    service_registry: require('./example_registry.json'),
    service_functions: require('./example_functions.js')
});

let inputs = {
    first_name: 'john',
    last_name: 'smith'
};

let outputType = 'full_name';

servicePath.getAndExecuteServicePath(inputs, outputType)
    .then((output) => {
        console.log(output);
    });
```

Now we ask service-path to try deduce the optimal path to get the value for ```full_name```. It will need to execute the function defined in the service registry to deduce ```full_name``` which it will find requires the ```first_name``` and ```last_name``` inputs, so excecuting the whole service path will return:
```sh
john smith
```

If you changed the outputType to something servicePath cannot deduce we get a warning. e.g if we set outputType to something else

```js
...
let outputType = 'birthday';
...
```

When executing you would recieve:

```
WARNING: No path found for output type: birthday
```

Similarly if you changed the function's required input types in the ```service_registry.json``` file to also require a middle name

```json
{
    "full_name" : {
        "type": "function",
        "input": [
            "first_name",
            "last_name",
            "middle_name"
        ],
        "output": "full_name"
    }
}
```

When executing you would recieve:

```
WARNING: No path found for output type: full_name
WARNING: - Could match: full_name
WARNING:   But missing input types: middle_name
```

### A graph with a network service

Now lets add a network service into the mix, we can do this by registering an API endpoint in the service registry, for example:

```json
{
    "recipes": {
        "address": "http://www.recipepuppy.com",
        "input": "ingredient",
        "output": "recipes",
        "output_api_path": "api",
        "output_timeout": 5000,
        "request_data": {
            "ingredient" : {
                "key": "i"
            }
        },
        "request_type": "GET",
        "response_key": "results",
        "type": "network"
    }
}
```

We have added a new network service that takes ```ingredient``` as an input and provides ```recipes``` as an output.

The full API path that will need to be executed underneath is ```http://www.recipepuppy.com/api?i={ingredient}```, which is configured via ```address```, ```output_api_path``` and the ```request_data``` map.

It is a ```GET``` request as configured in ```request_type``` with a ```output_timeout``` of 5s.

And we also say the service ```type``` is ```network```

The API will return an object like:

```json
{
    results: [...]
}
```

We are interested in the results array, so we also configure the service ```response_key``` to be ```results```

Now to set up service path:

```js
const servicePath = require('service-path');

servicePath.setup({
    service_registry: require('./example_registry.json')
});

let inputs = {
    ingredient: 'beef'
};

let outputType = 'recipes';

servicePath.getAndExecuteServicePath(inputs, outputType)
    .then((output) => {
        console.log(output);
    });
```

When you execute the script it just will return the collection of recipes:
```sh
[ { title: 'Magic  Prime Rib Recipe',
    href: 'http://www.recipezaar.com/Magic-Prime-Rib-Recipe-126865',
    ingredients: 'beef',
    thumbnail: 'http://img.recipepuppy.com/350074.jpg' },
...
```

If we want just the first recipe title to come back, we can add some new services to service-path, one that converts ```recipes``` into ```recipe``` and one that converts ```recipe``` into ```title```

Lets add an example_functions.js file again to create these services:

```js
module.exports['recipes__to__recipe'] = (recipes) => {
    return recipes[0]; // Just return the first one in the collection
}

module.exports['recipe__to__recipe_title'] = (recipe) => {
    return recipe['title']; // Return the title field in recipe
}
```

And lets register them in example_registry.json

```json
{
    ...
    "recipes__to__recipe": {
        "type": "function",
        "input": "recipes",
        "output": "recipe"
    },
    "recipe__to__recipe_title": {
        "type": "function",
        "input": "recipe",
        "output": "recipe_title"
    }
}

```

Add ```example_functions``` in the setup file

```js
...
servicePath.setup({
    service_registry: require('./example_registry.json'),
    service_functions: require('./example_functions.js') // <---
});
...
```

And set the output to ```recipe_title```

```js
...
let outputType = 'recipe_title';
...
```

Now when you execute the script you'll get back the the title for the first recipe:
```sh
Magic  Prime Rib Recipe
```

### A graph with a multiple services

The point of service-path is to tie service inputs and outputs together to achieve a desired output. So in this example we'll combine two network service and a couple of function services to achieve a localized greeting for a given name. So if provide a ```name``` .e.g ```Sebastian```

```json
{
    "recipes": {
        "address": "http://www.recipepuppy.com",
        "input": "ingredient",
        "output": "recipes",
        "output_api_path": "api",
        "output_timeout": 5000,
        "request_data": {
            "ingredient" : {
                "key": "i"
            }
        },
        "request_type": "GET",
        "response_key": "results",
        "type": "network"
    }
}
```

We have added a new network service that takes ```ingredient``` as an input and provides ```recipes``` as an output.

The full API path that will need to be executed underneath is ```http://www.recipepuppy.com/api?i={ingredient}```, which is configured via ```address```, ```output_api_path``` and the ```request_data``` map.

It is a ```GET``` request as configured in ```request_type``` with a ```output_timeout``` of 5s.

And we also say the service ```type``` is ```network```

The API will return an object like:

```json
{
    results: [...]
}
```

We are interested in the results array, so we also configure the service ```response_key``` to be ```results```

Now to set up service path:

```js
const servicePath = require('service-path');

servicePath.setup({
    service_registry: require('./example_registry.json')
});

let inputs = {
    ingredient: 'beef'
};

let outputType = 'recipes';

servicePath.getAndExecuteServicePath(inputs, outputType)
    .then((output) => {
        console.log(output);
    });
```

When you execute the script it just will return the collection of recipes:
```sh
[ { title: 'Magic  Prime Rib Recipe',
    href: 'http://www.recipezaar.com/Magic-Prime-Rib-Recipe-126865',
    ingredients: 'beef',
    thumbnail: 'http://img.recipepuppy.com/350074.jpg' },
...
```

If we want just the first recipe title to come back, we can add some new services to service-path, one that converts ```recipes``` into ```recipe``` and one that converts ```recipe``` into ```title```

Lets add an example_functions.js file again to create these services:

```js
module.exports['recipes__to__recipe'] = (recipes) => {
    return recipes[0]; // Just return the first one in the collection
}

module.exports['recipe__to__recipe_title'] = (recipe) => {
    return recipe['title']; // Return the title field in recipe
}
```

And lets register them in example_registry.json

```json
{
    ...
    "recipes__to__recipe": {
        "type": "function",
        "input": "recipes",
        "output": "recipe"
    },
    "recipe__to__recipe_title": {
        "type": "function",
        "input": "recipe",
        "output": "recipe_title"
    }
}

```

Add ```example_functions``` in the setup file

```js
...
servicePath.setup({
    service_registry: require('./example_registry.json'),
    service_functions: require('./example_functions.js') // <---
});
...
```

And set the output to ```recipe_title```

```js
...
let outputType = 'recipe_title';
...
```

Now when you execute the script you'll get back the the title for the first recipe:
```sh
Magic  Prime Rib Recipe
```


# Todos
* Still more documentation to come

License
----

ISC
