import type { Request, Response } from 'express';
import { fetchLtaData, resolveAccountKey } from './_ltaClient.js';

/**
 * Traffic incidents endpoint
 * Upstream: https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents
 * Header: AccountKey
 */
export default async function handler(req: Request, res: Response) {
  const accountKey = resolveAccountKey(req);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30');

  if (!accountKey) {
    // Return sample format matching LTA TrafficIncidents
    return res.status(200).json({
      odata_metadata: 'https://datamall2.mytransport.sg/ltaodataservice/$metadata#TrafficIncidents',
      value: [
        {
          Type: 'Accident',
          Latitude: 1.3325,
          Longitude: 103.8185,
          Message: '(10/11) 19:35 Accident on PIE (towards Changi Airport) before Adam Rd Exit. Lanes 1 and 2 blocked.',
        },
        {
          Type: 'Heavy Traffic',
          Latitude: 1.3120,
          Longitude: 103.8420,
          Message: '(10/11) 19:40 Heavy traffic on CTE (towards AYE) between Moulmein and Cairnhill Circle.',
        },
        {
          Type: 'Roadwork',
          Latitude: 1.3211,
          Longitude: 103.7423,
          Message: '(10/11) 19:00 Roadworks on AYE (towards Tuas) after Jurong Town Hall Rd Exit. Lane 4 closed.',
        },
      ],
      _warning: 'No LTA AccountKey provided. Set LTA_DATAMALL_ACCOUNT_KEY in .env or pass AccountKey header.',
      _liveMode: false,
    });
  }

  const result = await fetchLtaData('/TrafficIncidents', accountKey);

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
