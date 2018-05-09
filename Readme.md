# SimpleMocks

Ce module a pour but d'offrir la possibilite de mettre en place des mocks facilemnt et rapidement

## Utilisation

```cmd
npm install
node .
```

Les moficittions des fichiers mocks sont rechargées a chaud.

## Configuration
### Fichier config.json

[config.json](config.json)

```json
{
    "port": 8888,
    "mocks_dir": "./mocks",
    "log_level": "INFO"
}
```
* __port__ : port utilisé
* __mocks_dir__ : chemin relatif vers le dossier de mocks
* __log_level__ : niveau de log `DEBUG|INFO|WARN|ERROR`

### Fichiers mocks

[mock_exemple.json](mocks_exemples/exemple1.json)

#### Configuration du groupe
```json
{
    "name": "exemple",
    "baseUrl": "exemple/rest",
    "enable": true,
    "mock": []
}
```
* __name__ : nom du groupe de mock
* __baseUrl__ : base de l'url pour ce groupe de mock
* __enable__ : groupe de mock activé ou non
* __mock__ : liste des mocks

#### Mock

La priorité des réponse suit l'ordre de définition. Si la requete satisfait les criteres d'un mock, la réponse est renvoyée. Sinon, les mocks continuent d'etre testés jusqu'a la fin de la liste. Si la requete ne satisfait les criteres d'aucun mocks, une response `501 : Not Implemented` est renvoyé.

```json
{
    "url": "path",
    "method": "string",
    "headers": {
        "name" : "*"|"string"
    },
    "queryParams" : {
        "name" : "*"|"string"
    },
    "pathParams" : {
        "name" : "*"|"string"
    },
    "response": {
        "code": 200,
        "headers" : {
            "header_name" : "sting"
        },
        "body": null|"string"|{object}
    }    
}
```

* __url__ : url du WS. la syntaxe `:path_params_name` peut etre utilisée comme wildcard. l'url finale du mock est `<host>:<port>/<baseurl>/<url>`
* __method__ : methode http `get|post|put|delete|patch...`
* __headers__ : liste de headers a verifier. `*` peut etre utlisé comme wildcard, la présence du chaps est alors vérifiée, sans controle de sa valeur.
* __queryParams__ : identique a __headers__ pour les queryParams
* __pathParams__ : identique a __headers__ pour les paths params
* __response__ : réponse a renvoyer si le requete correspond aux criteres
    * __code__ : code http
    * __headers__ : liste des headers
    * __body__ : corps de la réponse. renseigner `null` ou omettre pour une reponse vide. Peut etre une chaine de carateres ou un objet. Si la valeur est un chaine de carateres commencant par `file://`, renvoi le contenu du fichier spécifié (chemin relatif)
