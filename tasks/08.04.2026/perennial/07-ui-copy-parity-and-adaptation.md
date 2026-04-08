# Perennial Signup UI Copy Parity And Adaptation

- Status: Ready For Implementation
- Date: 2026-04-08
- Category: Perennial Signup
- Owner: Frontend
- Priority: P0
- Task File: `tasks/08.04.2026/perennial/07-ui-copy-parity-and-adaptation.md`

## Goal

Reuse the old `/perennial-signup` page copy as closely as possible in the new Perennial signup page, while adapting any text that conflicts with the final confirmed product model.

This task exists so the implementing AI does not replace proven business copy with generic placeholder text.

## Core Rule

When the old copy still fits the new product behavior, keep it or stay extremely close to it.

When the old copy conflicts with the new confirmed product model, adapt it carefully instead of copying it blindly.

The most important conflict is:

1. the old UI asked users to type passwords
2. the new product model does not ask users to type passwords
3. passwords are generated automatically after successful payment and emailed to each member

## Old Copy To Preserve

### Main Hero / Intro Copy

Use this content as the source copy for the top section of the new page.

#### Heading

`Welcome to Our Living Circle of Wisdom`

#### Paragraph 1

`We warmly invite individuals, couples, and families to join a growing community like-minded souls who honor the timeless insights of Astrology and the living traditions of perennial wisdom. Here, we gather in sacred fellowship to learn, grow, and celebrate the spiritual arts - through teachings and trainings in astrology, yoga, meditation, tarot and the sacred texts of the world’s great lineages.`

#### Paragraph 2

`As a member, you’ll receive access to a private Backoffice that offers personalized chart readings for all ages (7 and up), carefully attuned to each stage of life. You’ll be able to participate in our monthly public rituals via webcast -- beautifully woven ceremonies that align us with the rhythms of the cosmos. In our members-only gatherings, families are encouraged to sit together as we read aloud and reflect on sacred texts such as the Bhagavad Gita, the Gospel of Thomas, and the Tao Te Ching.`

#### Paragraph 3

`We also offer special trainings for children, teens, and adults in the rich symbolism of astrology, tarot, and Jungian archetypes -- creating a space where spiritual learning becomes a shared journey across generations. Our intimate community meetings bring heart-centered, spiritually grounded connection into focus, weaving together the mystical with the practical in everyday life.`

#### Highlighted Closing Line

`Come take your place in a community devoted to awakening, understanding, and the shared joy of inner discovery.`

## Form Header Copy

The form area should preserve this framing unless a small wording adjustment is needed for layout or clarity.

### Main Form Heading

`Join our Community as an Individual, Couple or Family`

### Helper Text

`Fields marked with an asterisk (*) are required.`

## Additional Member Copy

### Section Heading

`Add another member`

### Relation Label

`* Relation`

### Relation Options

1. `Partner/Couple`
2. `Family`

### Relationship Type Label

`* Relationship Type`

### Relationship Type Options For Couple

1. `Husband`
2. `Wife`

### Relationship Type Options For Family

1. `Son`
2. `Daughter`
3. `Spouse`
4. `Partner`
5. `Other Family Member`

## Required Field Labels To Preserve

These visible labels should remain the source of truth where they still match the new data model.

1. `* First Name`
2. `* Last Name`
3. `* Date of Birth`
4. `* State`
5. `* City`
6. `* Zip`
7. `* Time of Birth`
8. `* Email`
9. `* Phone`
10. `* Gender`
11. `* Occupation`
12. `* Full Address`

### Gender Options

1. `Male`
2. `Female`
3. `Other`

## Copy That Must Be Adapted

These old labels must not be copied directly because they conflict with the new confirmed signup model.

Old labels:

1. `* Password`
2. `* Confirm Password`

### Required Adaptation

Instead of password input labels, the new UI must communicate:

1. login credentials will be created automatically after successful payment
2. each member will receive their login credentials by email
3. the form does not require manual password creation

The implementing AI may choose the exact placement, but this message must be obvious in the signup flow and visible before payment.

## Optional Section Intro Copy

Keep this section copy or very close wording:

`The following questions are not required, but because we run`
`you and your Family's astrology it can help us curate`
`more specialized responses from our engine.`

The UI may normalize line breaks, but should preserve the meaning and tone.

### Accordion Toggle Labels

1. `Expand Section for Complete Details`
2. `Collapse Section to Hide Details`

## Optional Questionnaire Copy

### Section Title

`Relationship Status`

### Relationship Status Options

1. `Single`
2. `Married`
3. `Separated`
4. `Divorced`
5. `Widowed`

### Section Title

`Personality and Life`

### Field Labels

1. `Describe Your Personality`
2. `Primary Strengths and Talents`
3. `Life Areas Currently Fulfilling`
4. `Life Areas Needing Improvement`
5. `Long-Term Goals and Aspirations`
6. `Major Life Events/Experiences`

### Section Title

`Relationships, Social Dynamics, and Current Challenges`

### Field Label

`Describe any current challenges in your work or personal life...`

### Switch Labels

1. `Focus on Specific Relationships (Yes/No)`
2. `Guidance on Specific Decision/Situation (Yes/No)`
3. `Concerns About Romantic Life (Yes/No)`
4. `Ongoing Projects or Plans (Yes/No)`
5. `Social Life Fulfillment (Yes/No)`

### Section Title

`Spiritual and Personal Growth`

### Switch Labels

1. `Spiritual or Personal Growth Practices`
2. `Exploring Self-Discovery/Personal Development`
3. `Belief in External Influences on Life (Yes/No)`

## Bottom Action Copy

### Add Members Button Text

`add spouse or partner and family members`

### Pricing Line Template

`Subscription: {type} - ${amount}/month`

### Submit Button

`Sign Up`

## Payment Step Copy

The payment stage should reuse this language pattern where it still fits the new flow.

### Heading

`Complete Your Payment`

### Pricing Line Template

`Subscription: {type} - ${amount}/month`

### Payment Button

`Pay Now`

## Required Copy Adaptations For New Model

The implementing AI must add clear new copy for these realities even though the old page did not frame them this way:

1. the primary member is the billing owner
2. additional members will also receive accounts
3. every member must use a unique email address
4. credentials are generated after successful payment
5. credentials are emailed automatically to each member
6. membership becomes active only after successful payment

This adaptation must feel like a careful extension of the old copy, not an abrupt change in tone.

## Do Not Do

1. Do not replace the hero and form copy with generic SaaS text.
2. Do not ignore the old wording and write new filler copy.
3. Do not reintroduce password fields just because the old UI had them.
4. Do not leave the generated-credentials flow unexplained.
5. Do not change `Single`, `Couple`, and `Family` naming unless explicitly required.

## Acceptance Criteria

1. the new page preserves the old Perennial tone and messaging
2. hero copy is reused or kept very close
3. section headings and field labels remain aligned with old UI wording
4. password-related copy is correctly adapted to the new generated-password model
5. the new page does not feel like a generic rewrite disconnected from the old product identity
