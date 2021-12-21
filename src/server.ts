import { app } from '.';
import { announce } from './utils/logging';
import { createServer } from 'http';

const port = process.env.PORT ?? 3000;

const server = createServer(app);
export default server;
import './socket';

server.listen(port, () => {
    announce(`App is online op poort ${port}. Bezoek ${process.env.CALLBACK_URI} in je browser.`);
});
