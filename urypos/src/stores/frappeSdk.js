import { FrappeApp } from "frappe-js-sdk";

let host = window.location.hostname;
let port = window.location.port;
let protocol = port ? "http" : "https";
let url = `${protocol}://${host}:${port}`;

export const frappe = new FrappeApp(url);

export default frappe;
