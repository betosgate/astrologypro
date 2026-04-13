# 02 Role to Package Assignment Rules for Diviner and Trainee

## Goal

Define how `diviner` and `trainee` resolve to one of the service-capability packages.

## Product Rule

Both roles must follow the same package logic:

- astro and tarot
- astrology only
- tarot only

## Recommended Model

Each role profile should resolve:

- current package code
- effective category permissions

This should support admin overrides later if needed.

## Deliverables

- role-to-package assignment rules
- defaulting logic at signup
- override and audit rules

## Status

Done.
