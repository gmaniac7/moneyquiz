// Type definitions for node-multiparty
// Project: https://github.com/andrewrk/node-multiparty
// Definitions by: Ken Fukuyama <https://github.com/kenfdev>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/// <reference path="../express/express.d.ts" />

declare module "connect-multiparty" {
    import express = require('express');
    function e(secret?: string, options?: any): express.RequestHandler;
    namespace e{}
    export = e;
}
