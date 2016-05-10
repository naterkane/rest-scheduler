#!/bin/bash

#docker build -t dcps/mongo .
#docker run -p 27017:27017 -dns 8.8.8.8 -dns 8.8.4.4 --name schedu#ler -d dcps/mongo  --smallfiles

docker run -p 27017:27017 --name scheduler -d mongo  --smallfiles
