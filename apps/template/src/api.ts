import { HttpApi } from "effect/unstable/httpapi";

import { TasksApiGroup } from "@/services/task/api.group";

export const Api = HttpApi.make("Api").add(TasksApiGroup).prefix("/api");
