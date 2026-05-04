import * as signalR from "@microsoft/signalr";
import { API_BASE_URL } from "./api";

export function createHub(): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/hubs/live`)
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}
