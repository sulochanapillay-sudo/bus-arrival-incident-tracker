import type { Request, Response } from 'express';
import { fetchLtaData, resolveAccountKey } from './_ltaClient.js';

/**
 * Carpark availability endpoint (v2)
 * Upstream: https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
 * Header: AccountKey
 */
export default async function handler(req: Request, res: Response) {
  const accountKey = resolveAccountKey(req);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');

  if (!accountKey) {
    return res.status(200).json({
      odata_metadata: 'https://datamall2.mytransport.sg/ltaodataservice/$metadata#CarParkAvailabilityv2',
      value: [
        {
          CarParkID: 'MALL_SUNTEC',
          Area: 'Marina',
          Development: 'Suntec City Mall',
          Location: '1.2935 103.8572',
          AvailableLots: 428,
          LotType: 'C',
          Agency: 'LTA',
        },
        {
          CarParkID: 'MALL_ION',
          Area: 'Orchard',
          Development: 'ION Orchard',
          Location: '1.3040 103.8318',
          AvailableLots: 42,
          LotType: 'C',
          Agency: 'LTA',
        },
      ],
      _warning: 'No LTA AccountKey provided. Set LTA_DATAMALL_ACCOUNT_KEY in .env or pass AccountKey header.',
      _liveMode: false,
    });
  }

  const result = await fetchLtaData('/CarParkAvailabilityv2', accountKey);

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
