# 0012. Not revealing which emails have an account

- Status: Accepted
- Date: 2026-10-28

## Context

Sign-in and sign-up screens can reveal whether an email is registered ("account enumeration"). That gives an
attacker a list of real accounts to try passwords on or to phish. The usual fix for sign-up answers every
attempt with "Check your email" and sends a "you already have an account" email instead. We have no email
sending until after the MVP (ADR 0003), so sign-up can't hide it fully: if no account is created, the person
can tell why.

## Decision

- **Sign in:** one message for an unknown email and a wrong password: "That email and password don't match".
  The answer takes about the same time either way (an unknown email still costs a password-hash check).
- **Sign up:** a taken email gets a neutral banner, "We couldn't create an account with this email", with a
  "Sign in with this email" link. It doesn't say that an account exists. Format checks (email, password length)
  stay under their fields.
- **Rate limiting** (ASP.NET Core rate limiter) on the sign-in and sign-up endpoints per IP address, so emails
  can't be checked in bulk. Identity's lockout after repeated wrong passwords stays on.
- When email arrives (Resend, after the MVP), sign-up moves to "Check your email to finish" for every attempt.

## Consequences

- Someone who forgot they have an account sees a slightly vaguer message; the sign-in link gets them on.
- The rate limits need numbers that don't block a family on one home IP; they are set and tested in F-011.
- Google sign-in (F-012) goes through Google, so it doesn't reveal anything on our side.
