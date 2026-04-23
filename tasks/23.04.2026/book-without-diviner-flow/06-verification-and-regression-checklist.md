# 06 Verification And Regression Checklist

## Goal

Ensure the new non-diviner booking path works without breaking the existing booking system.

## Required Test Paths

### A. Post-Intake Dialog

- complete intake on a general template
- click `Choose a Diviner and Book`
- confirm discover flow still works
- complete intake again
- click `Book Without Choosing a Diviner`
- confirm it no longer hits `/book/demo`

### B. Shared Booking Route

- invalid submission id
- mismatched template + submission
- valid submission with no compatible diviners
- valid submission with one compatible diviner
- valid submission with multiple compatible diviners

### C. Date And Diviner Resolution

- choose a date with zero matches
- choose a date with one match
- choose a date with two or more matches
- verify only compatible diviners appear

### D. Existing Booking Handoff

- continue into `/{username}/book/{serviceSlug}`
- verify the booking page still renders normally
- verify submission id remains attached

### E. Regression Checks

- direct diviner booking route still works
- discover route still works for `Choose a Diviner and Book`
- template public pages still work
- service visibility rules still block unpublished/unavailable services correctly

## Required Verification Artifacts

Claude must leave behind:
- brief implementation summary
- list of routes/components changed
- list of APIs/contracts changed
- explicit note of anything not fully completed

