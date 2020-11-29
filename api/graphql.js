const { parseConfig } = require("@graphql-mesh/config");
const { getMesh } = require("@graphql-mesh/runtime");
const path = require("path");
const meshConfig = require("../meshrc.json");
const { ApolloServer } = require("apollo-server-micro");
import "@graphql-mesh/json-schema";
import "@graphql-mesh/transform-rename";
// In a production environment we would want to secure this endpoint

const apiKey = process.env.FINNHUB_API_KEY;

function formatDate(date) {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

module.exports = async (req, res) => {
  const { body } = req;
  const now = new Date();
  const parsedConfig = await parseConfig({
    sources: [
      {
        name: "Stock API",
        handler: {
          jsonSchema: {
            baseUrl: "https://finnhub.io/api/v1",
            operations: [
              {
                field: "stockProfile",
                path: `/stock/profile2?symbol={args.symbol}&token=${apiKey}`,
                type: "Query",
                method: "GET",
                argTypeMap: {
                  symbol: "String",
                },
                description: "Get general information of a company",
                responseSchema: path.join(
                  __dirname,
                  "..",
                  "./json-samples/companyProfile.json"
                ),
              },
              {
                field: "newsSentimentByStock",
                path: `news-sentiment?symbol={args.symbol}&token=${apiKey}`,
                type: "Query",
                method: "GET",
                argTypeMap: {
                  symbol: "String",
                },
                description:
                  "Get company's news sentiment and statistics. This endpoint is only available for US companies.",
                responseSchema: path.join(
                  __dirname,
                  "..",
                  "./json-samples/companySentiment.json"
                ),
              },
              {
                field: "stockQuote",
                path: `/quote?symbol={args.symbol}&token=${apiKey}`,
                type: "Query",
                method: "GET",
                argTypeMap: {
                  symbol: "String",
                },
                description:
                  "Get real-time quote data for US stocks. Constant polling is not recommended. `o = open price of the day` `h = high price of the day` `l = low price of the day` `c = current price of the day` `pc = previous close price`",
                responseSchema: path.join(
                  __dirname,
                  "..",
                  "./json-samples/companyQuote.json"
                ),
              },
              {
                field: "companyNews",
                path: `company-news?symbol={args.symbol}&from=2000-01-01&to=${formatDate(
                  now
                )}&token=${apiKey}`,
                type: "Query",
                method: "GET",
                argTypeMap: {
                  symbol: "String",
                  endDate: "String",
                },
                description:
                  "List latest company news by symbol. This endpoint is only available for North American companies.",
                responseSchema: path.join(
                  __dirname,
                  "..",
                  "./json-samples/companyNews.json"
                ),
              },
              {
                field: "etfProfile",
                path: `/etf/profile?symbol={args.etfSymbol}&token=${apiKey}`,
                type: "Query",
                method: "GET",
                argTypeMap: {
                  etfSymbol: "String",
                },
                description:
                  "Get ETF profile information. Currently support all US ETFs.",
                responseSchema: path.join(
                  __dirname,
                  "..",
                  "./json-samples/etfProfile.json"
                ),
              },
            ],
          },
        },
      },
    ],
  });

  const { schema, contextBuilder: context } = await getMesh(parsedConfig);

  return new ApolloServer({
    schema,
    context,
    introspection: true,
    playground: true,
  }).createHandler({ path: "/api/graphql" })(req, res);
};
