import express from 'express';
import cors from 'cors';
import router from './routes';
import initServices from './services/init.services';

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

await initServices();

app.use('/api/v1', router);

app.listen(8080, () => {
    console.log('server running');
});
