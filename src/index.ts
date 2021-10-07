import express, { Response, Request } from 'express';
import Datastore from 'nedb';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = 8000;

const db = new Datastore();
interface IIncident {
  emailClient: string;
  pickupLocation: string;
  incidentDate: Date;
  incidentType: string;
  cause: string;
  resolution: string;
  reimbursedAmount: string;
};

const jsonParser = bodyParser.json();

app.use(cors({
  origin: '*'
}));
interface IQueryParams {
  page: number;
  limit: number;
  dateRange: string;
}
// http://localhost:8000/reimbursements?page=0&limit=5&dateRange=[2021-09-04T22:00:00.000Z,2021-09-22T22:00:00.000Z]
app.get(
  '/reimbursements',
  (req: Request<{}, {}, {}, IQueryParams>, res: Response) => {
    const page = req.query.page !== undefined ? req.query.page : 0;
    const limit = req.query.limit !== undefined ? req.query.limit : Infinity;
    const dateRange = req.query.dateRange.split(',');
    db.find({
      'incidentDate': {
        $gte: new Date(dateRange[0]),
        $lte: new Date(dateRange[1]),
      },
      'reimbursedAmount': {
        $ne: null
      }
    }).sort({ incidentDate: 1, emailClient: 1 }).skip((page) * limit).limit(limit).exec((err: Error | null, incidents: IIncident[]) => {
      db.count({
        'incidentDate': {
          $gte: new Date(dateRange[0]),
          $lte: new Date(dateRange[1]),
        },
        'reimbursedAmount': {
          $ne: null
        }
      }, (err, count) => {
        res.json({
          data: incidents,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalCount: count
        });
      });

    });
  }
);
app.get(
  '/incidents',
  (req: Request<{}, {}, {}, IQueryParams>, res: Response) => {
    const page = req.query.page !== undefined ? req.query.page : 0;
    const limit = req.query.limit !== undefined ? req.query.limit : 5;

    db.find({
      // created_at: {
      //   $gte: new Date(),
      //   $lt: ISODate("2010-05-01T00:00:00.000Z")
      // }

    }).sort({ incidentDate: 1, emailClient: 1 }).skip((page) * limit).limit(limit).exec((err: Error | null, incidents: IIncident[]) => {
      db.count({}, (err, count) => {
        res.json({
          data: incidents,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalCount: count
        });
      });

    });
  }
);
app.post(
  '/incidents',
  jsonParser,
  (req: Request<{}, {}, IIncident>, res: Response) => {
    const incidentToInsert = req.body;
    incidentToInsert.incidentDate = new Date(req.body.incidentDate);
    db.insert(incidentToInsert, (err: Error | null, newIncident: IIncident) => {
      res.status(201).json(newIncident);
    });

  }
);
app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});
