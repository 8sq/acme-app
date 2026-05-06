# Changelog

## [0.2.0](https://github.com/8sq/acme-app/compare/app-v0.1.0...app-v0.2.0) (2026-05-06)


### Features

* Add cache health check ([#99](https://github.com/8sq/acme-app/issues/99)) ([a6047cb](https://github.com/8sq/acme-app/commit/a6047cba93b8e1e332c3d35bd03e91087f730dfb))
* add Cache support ([#76](https://github.com/8sq/acme-app/issues/76)) ([0de236c](https://github.com/8sq/acme-app/commit/0de236c7cc180c3d297730b7c477db17a3ed1bcf))
* better storage backend ([#140](https://github.com/8sq/acme-app/issues/140)) ([9fcfdaa](https://github.com/8sq/acme-app/commit/9fcfdaad7accf31497bdd03a4e21e3c859dc1906))
* Improve env access in nitro and hono ([#93](https://github.com/8sq/acme-app/issues/93)) ([310082c](https://github.com/8sq/acme-app/commit/310082c370dbae0343d60100220ac27f6f43a862))
* Make cache return undefined on miss, instead of null ([#100](https://github.com/8sq/acme-app/issues/100)) ([3d86b0f](https://github.com/8sq/acme-app/commit/3d86b0f8ea46e435a931d42b26ccf3b8f257a437))
* Refactor main app ([#124](https://github.com/8sq/acme-app/issues/124)) ([4a5d9b1](https://github.com/8sq/acme-app/commit/4a5d9b1e800255be0bf92b935ec6657ab0a16cb1))
* support S3 Storage ([#90](https://github.com/8sq/acme-app/issues/90)) ([7410caa](https://github.com/8sq/acme-app/commit/7410caaff5b95bc4b207690405787f73d3f1dc26))


### Bug Fixes

* turbo should forward env vars in dev container ([#151](https://github.com/8sq/acme-app/issues/151)) ([b4e5d0c](https://github.com/8sq/acme-app/commit/b4e5d0c813ddbb20e372c446076886b9349aa85b))


### Refactoring

* externalize libsql client ([#79](https://github.com/8sq/acme-app/issues/79)) ([f526170](https://github.com/8sq/acme-app/commit/f52617044e776665a5754a8824b92aaa14839864))
* extract cache app to its own package ([#117](https://github.com/8sq/acme-app/issues/117)) ([ad71db8](https://github.com/8sq/acme-app/commit/ad71db8ae8a9a5ee1a703c54a9462a34853d536a))
* Extract sentry to its own app ([#72](https://github.com/8sq/acme-app/issues/72)) ([e29e352](https://github.com/8sq/acme-app/commit/e29e352e17cf9617f833d3ab572b8e450b423d3b))
* extract storage to its own package ([#118](https://github.com/8sq/acme-app/issues/118)) ([e13cf93](https://github.com/8sq/acme-app/commit/e13cf932961a3c60a598e4ff80a9ec5a511f24b1))
* Extract the db project into its own package ([#115](https://github.com/8sq/acme-app/issues/115)) ([3be17ff](https://github.com/8sq/acme-app/commit/3be17ffeedd2ded0a91beb0846535d442d7b1f07))


### CI/CD

* Suppress database unreachable errors caused by CI healthcheck ([#134](https://github.com/8sq/acme-app/issues/134)) ([39bf6b1](https://github.com/8sq/acme-app/commit/39bf6b1fceeba8602acf56a5ae06aa184c8173e9))


### Miscellaneous

* **deps:** update dependency oxlint to v1.59.0 ([#81](https://github.com/8sq/acme-app/issues/81)) ([72e88e7](https://github.com/8sq/acme-app/commit/72e88e7580fb67f558a23ca9456f6a16cb2b0bcf))
* Rename the project into [@acme](https://github.com/acme) and restructure it ([#42](https://github.com/8sq/acme-app/issues/42)) ([6811344](https://github.com/8sq/acme-app/commit/6811344ac0f9b924d92774975d72c2d595d9b19a))
* Switch from bun to node ([#47](https://github.com/8sq/acme-app/issues/47)) ([3039f81](https://github.com/8sq/acme-app/commit/3039f81077ea36d69705415e0e36bcf6b6391c99))
