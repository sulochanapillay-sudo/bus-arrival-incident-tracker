import type { Request, Response } from 'express';
import { fetchLtaData, resolveAccountKey } from './_ltaClient.js';

/**
 * Next buses at a stop (v3 - current version; 20-second refresh)
 * Upstream: https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139
 * Header: AccountKey
 */
export default async function handler(req: Request, res: Response) {
  const busStopCode = (req.query.BusStopCode || req.query.busStopCode || '83139') as string;
  const serviceNo = (req.query.ServiceNo || req.query.serviceNo) as string | undefined;

  const accountKey = resolveAccountKey(req);

  res.setHeader('Content-Type', 'application/json');
  // 20-second refresh cadence as per LTA specifications
  res.setHeader('Cache-Control', 'public, max-age=20, s-maxage=20');

  if (!accountKey) {
    // Return sample mock payload matching LTA v3 schema if no AccountKey configured yet
    const simulatedArrivalTime = new Date(Date.now() + 3 * 60 * 1000).toISOString();
    const simulatedNextTime = new Date(Date.now() + 11 * 60 * 1000).toISOString();

    return res.status(200).json({
      odata_metadata: 'https://datamall2.mytransport.sg/ltaodataservice/$metadata#v3.BusArrival',
      BusStopCode: busStopCode,
      Services: [
        {
          ServiceNo: serviceNo || '15',
          Operator: 'GAS',
          NextBus: {
            OriginCode: '77009',
            DestinationCode: '17009',
            EstimatedArrival: simulatedArrivalTime,
            Latitude: '1.3142',
            Longitude: '103.8821',
            VisitNumber: '1',
            Load: 'SEA', // Seats Available
            Feature: 'WAB', // Wheelchair Accessible Bus
            Type: 'DD', // Double Decker
          },
          NextBus2: {
            OriginCode: '77009',
            DestinationCode: '17009',
            EstimatedArrival: simulatedNextTime,
            Latitude: '1.3090',
            Longitude: '103.8750',
            VisitNumber: '1',
            Load: 'SDA', // Standing Available
            Feature: 'WAB',
            Type: 'SD', // Single Decker
          },
        },
        {
          ServiceNo: '150',
          Operator: 'SBST',
          NextBus: {
            OriginCode: '83009',
            DestinationCode: '83009',
            EstimatedArrival: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            Latitude: '1.3170',
            Longitude: '103.8900',
            VisitNumber: '1',
            Load: 'SEA',
            Feature: 'WAB',
            Type: 'SD',
          },
          NextBus2: {
            OriginCode: '83009',
            DestinationCode: '83009',
            EstimatedArrival: new Date(Date.now() + 16 * 60 * 1000).toISOString(),
            Latitude: '',
            Longitude: '',
            VisitNumber: '1',
            Load: 'LSD', // Limited Standing
            Feature: 'WAB',
            Type: 'SD',
          },
        },
      ],
      _warning: 'No LTA AccountKey provided. Set LTA_DATAMALL_ACCOUNT_KEY in .env or pass AccountKey header.',
      _liveMode: false,
    });
  }

  // Fetch upstream from LTA DataMall v3 BusArrival
  const result = await fetchLtaData('/v3/BusArrival', accountKey, {
    BusStopCode: busStopCode,
    ServiceNo: serviceNo,
  });

  if (!result.ok) {
    return res.status(result.status).json({
      error: result.error,
      statusCode: result.status,
      upstreamData: result.data,
      _hint: 'Ensure your LTA DataMall AccountKey is valid and active.',
    });
  }

  return res.status(200).json(result.data);
}
