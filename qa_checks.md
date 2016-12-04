# QA datasets and checks

## Dataset 1

This dataset has two prisons and a two courts.

Prison 2 is 200km north of prison 1.

One court is 50km north of prison 1, 100 minutes away
One court is 50km south of prison 2, 100 minutes away

Checks completed:

* Checked threholds make sense overall and at court level
* Checked overall average duration is 100 minutes
* Checked prison 'capacity in use' makes sense

Observations:
* I note that where demand is split between multiple prisons, computations are based on the prison to which the plurality of the demand is going.

Screenshot:
![Dataset1 screenshot](qa_screenshots/dataset1.png)

## Dataset 2

This dataset has 30 courts of demand = 10 spaced evenly between the two prisons.

When both prisons are large, we expect:
Average distance to be 75, average duration to be 150.

Checks completed:
* Verified that average distance is 75 and duration 150 when both prisons are large.
* When both prisons are of size 20, then have capacity for 2 courts each, average distance 10 and duration 20
* Varied capacities, including making them unbalanced.

Screenshot:
![Dataset1 screenshot](qa_screenshots/dataset2.png)

Notes:
A bug was found whereby legacy code was assigning courts to prisons despite the courts being full.  It was fixed.


## Dataset 3
This dataset is constructed so that some courts get assigned to a second best prison despite being the closest to the first.  Prisons are 20 and 50km away from the prisons

Checks completed:

* Verify that courts get assigned to expected prisons
* Verify stats - in the unbalanced supply shown in screenshot, we expect average distance to prison 1 to be 50, average duration 100.  For prison 2, distance is 280km, 20km and 50km, so expect average of 116.66.  Overall average distance = 100km and duration 200.

Screenshot:
![Dataset1 screenshot](qa_screenshots/dataset3.png)

## Dataset 4

We generate a large number of courts 50 km away from each prison and see what happens.

Checks completed:

* Verified that average duration is 100 when all courts assigned to nearest prison
* Verified that average duration is around 350 when all courts assinged to single prison


Screenshot:
![Dataset1 screenshot](qa_screenshots/dataset4.png)

## Dataset 5

Generate a dataset which has been designed to cause prisons to be assigned to second best , third best etc.

Checks completed:

* Discussed with Hayden whether the allocation displayed looks optimal.  Concluded that it probably is, and if not, there would be very little scope for improvement.
*  Verified threshold statistics


Screenshot:
![Dataset1 screenshot](qa_screenshots/dataset5.png)

## Dataset 6 - check thresholds
Create a dataset where we know in advance that 25% of people will be <30m, 60m, 120m, >120m


Checks completed:

* Verify that thresholds are correct both in the overall statistics and for the individual courts

Screenshot:
![Dataset1 screenshot](qa_screenshots/dataset6.png)