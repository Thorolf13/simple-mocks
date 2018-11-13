# SimpleMocks

Ce module a pour but d'offrir la possibilite de mettre en place des mocks facilement et rapidement.
Il offre la possibilite de définir des mocks via des fichiers json ou a partir d'un fichier de log reseau provenant de Google Chrome (fichiers HAR).

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

* [mock_exemple.json](mocks_exemples/exemple1.json)
* [mock_exemple_fichier_har.json](mocks_exemples/exemple_harFile.json)

#### Configuration du groupe
```json
{
    "name": "exemple",
    "baseUrl": "exemple/rest",
    "enable": true,
    "mock": [],
    "har" : []
}
```
* __name__ : nom du groupe de mock
* __baseUrl__ : base de l'url pour ce groupe de mock
* __enable__ : groupe de mock activé ou non
* __mock__ : liste des mocks
* __har__ : liste des fichiers HAR a charger

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
* __headers__ : _facultatif_ liste de headers a verifier. `*` peut etre utlisé comme wildcard, la présence du chaps est alors vérifiée, sans controle de sa valeur.
* __queryParams__ : _facultatif_ identique a __headers__ pour les queryParams
* __pathParams__ : _facultatif_ identique a __headers__ pour les paths params
* __response__ : réponse a renvoyer si le requete correspond aux criteres
    * __code__ : code http
    * __headers__ : _facultatif_ liste des headers
    * __body__ : _facultatif_ corps de la réponse. renseigner `null` ou omettre pour une reponse vide. Peut etre une chaine de carateres ou un objet. Si la valeur est un chaine de carateres commencant par `file://`, renvoi le contenu du fichier spécifié (chemin relatif)

#### Har
Permet de generer des mocks a partir d'un fichier `*.har` issu de Google Chrome.
Utile pour rejouer un cas test.

Le domaine présent dans les url du fichier HAR sera supprimé et remplacé par la `baseUrl` du fichier de configuration.

Les entrées du fichier HAR sont prise en compte dans l'ordre inverse : du plus recent au plus ancient.

```json
{
    "filePath" : "string",
    "options" : {
        "filter" : ["string"]|"string",
        "queryParams" :{
            "ignore" : ["string"]
        }
    }
}
```
* __filePath__ : chemin relatif vers le fichier HAR
* __options__ : _facultatif_ options pour le parsing du fichier
    * __filter__ : _facultatif_ filtre sur les urls presentes dans le fichier HAR. les valeur sont gérées comme des expressions régulières. Si l'url valide un seul filtre, elle est inclut dans le mock
    * __queryParams__ : _facultatif_ option sur les query params
        * __ignore__ : liste des query params a ignorer. Par défaut, tous les query params devront etres identique pour que l'appel match le mock. Si il y a des query params avec a date courante ou une valeur aleatoire, il peut etre utile de les ignorer

Pour generer le fichier har :
* Ouvrir la console debug de Chrome
* Se placer dans l'onglet 'Network'
* Cocher la case 'Preserve log'
* Se Placer dans l'etat de debut du scenario de test (avant connexion/intialisation)
* Clic sur le bouton 'Clear'
* Jouer un scenario
* Une fois fini, faire un clic droit sur l'une des lignes du log network et cliquer sur 'Save as HAR with content'
