import express from 'express';
import * as GeoController from './geo.controller';
import { tryAuth } from '../../shared/middlewares/auth';

const router = express.Router();

router.get('/config', tryAuth, GeoController.getGeoConfig); // 🌍 IP Intelligence (With Optional Billing Override)
router.get('/countries', GeoController.getCountries); // 🌍 Get All Countries
router.get('/states/:countryCode', GeoController.getStates); // 🗺️ Get States by Country
router.get('/cities/:countryCode/:stateCode', GeoController.getCities); // 🏙️ Get Cities by State

export default router;
