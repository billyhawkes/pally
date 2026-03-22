import { Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { HttpApiScalar } from "effect/unstable/httpapi";
import { PallyApi } from "./api";
import { apiLayer } from "./api-builder";

const docsLayer = HttpApiScalar.layer(PallyApi, { path: "/api/docs" });
const allRoutes = Layer.mergeAll(apiLayer, docsLayer);

const { handler } = HttpRouter.toWebHandler(
  Layer.provide(allRoutes, HttpServer.layerServices),
);

export { handler };
