# NestJS API Reference
## `divine-infinite-being-nest-api`

> Framework: NestJS 10 + Fastify | DB: MongoDB (Mongoose) | Deployment: AWS Lambda
> Total controllers: 44 | Total endpoints: 300+

All endpoints accept JSON. Standard list request body:
```json
{ "condition": {"limit": 10, "skip": 0}, "searchcondition": {}, "sort": {"type": "desc", "field": "created_at"} }
```

---

## 1. Admin Controller — `/admin`

| Method | Route | Purpose |
|---|---|---|
| POST | `/training-category-add` | Add training category |
| POST | `/training-list` | List training categories |
| GET | `/training-category-fetch` | Fetch single category |
| POST | `/training-category-delete` / `/training-category-deletemany` | Delete category(ies) |
| POST | `/training-category-update` | Update category |
| POST | `/training-status-change` / `/training-status-changemany` | Change category status |
| POST | `/training-list-count` | Count categories |
| POST | `/lesson-add` | Add lesson |
| POST | `/lesson-list` | List lessons |
| POST | `/fetch-lesson-list` | Fetch lesson list |
| GET | `/prerequisite-lesson` | Fetch prerequisite lessons |
| POST | `/lesson-delete` / `/lesson-deletemany` | Delete lesson(s) |
| POST | `/lesson-fetch` | Fetch single lesson |
| POST | `/lesson-update` | Update lesson |
| POST | `/lesson-status-change` / `/lesson-status-changemany` | Change lesson status |
| POST | `/lesson-list-count` | Count lessons |
| POST | `/lesson-name-autocomplete-with-assignment` | Autocomplete lesson names |
| POST | `/lesson-single-fetch` | Single lesson fetch |
| POST | `/lesson-prerequisite-list` | List prerequisite lessons |
| POST | `/training-category-list` | Training category list |
| POST | `/training-category-single-fetch` | Single category fetch |
| POST | `/lesson-add-update` | Add or update lesson |
| POST | `/quiz-add` | Add quiz question |
| POST | `/quiz-list-count` | Count quiz questions |
| POST | `/quiz-list` | List quiz questions |
| POST | `/quiz-delete` / `/quiz-deletemany` | Delete quiz(zes) |
| POST | `/quiz-update` | Update quiz |
| POST | `/quiz-status-change` / `/quiz-status-changemany` | Change quiz status |
| POST | `/quiz-preview` | Preview quiz |
| POST | `/quiz-fetch-by-lesson` | Fetch quiz by lesson |
| POST | `/calculate-quiz-result` | Calculate quiz results |
| POST | `/quiz-add-update` | Add or update quiz |
| POST | `/quiz-single-fetch` | Single quiz fetch |
| POST | `/role-add` | Add role |
| POST | `/role-preview` | Preview role |
| POST | `/role-update` | Update role |
| POST | `/role-delete` / `/role-deletemany` | Delete role(s) |
| POST | `/role-list-count` | Count roles |
| POST | `/role-list` | List roles |
| POST | `/role-status-change` / `/role-status-changemany` | Change role status |
| POST | `/role-single-fecth` | Single role fetch |
| GET | `/fetch-role-list` | Fetch all roles (dropdown) |
| POST | `/mundane-astrlogy-read-write-access` | Grant mundane astrology access |

---

## 2. User Controller — `/user`

| Method | Route | Purpose |
|---|---|---|
| POST | `/user-list` | List all users |
| POST | `/user-list-count` | Count users |
| POST | `/user-single-fecth` | Fetch single user |
| POST | `/user-preview` | User preview modal data |
| POST | `/signup` | User registration |
| GET | `/signup-verification` | Email OTP verification |
| GET | `/request-verification-code` | Resend verification code |
| POST | `/login` | User login |
| POST | `/force-change-password` | Forced password change |
| GET | `/states` | Get US states list |
| GET | `/logout/:username` | User logout |
| POST | `/logout-new` | New logout endpoint |
| POST | `/check-token` | Validate JWT token |
| POST | `/send-reset-password-otp` | Send reset OTP |
| POST | `/reset-password` | Reset password via OTP |
| POST | `/change-password` | Change password |
| POST | `/update-user` | Update user profile |
| POST | `/delete-user` | Delete user |
| POST | `/status-change` / `/status-changemany` | Change user status |
| POST | `/fetch-last-login` | Fetch last login info |
| POST | `/user-role-update` | Update user role |
| POST | `/fetch-login-details` | Fetch login history |
| POST | `/resend-welcome-mail` | Resend welcome email |
| POST | `/send-resetpassword-mail` | Send reset password email |
| POST | `/mark-as-graduate-mail` | Send graduation email |
| GET | `/fetch-astro-tarot` | Fetch astrologer/tarot list |
| GET | `/build-connection` | Health check / DB connect |
| POST | `/customer-signup` | Customer registration |
| POST | `/customer-list` | List customers |
| POST | `/customer-list-count` | Count customers |
| POST | `/customer-list-autocomplete` | Customer autocomplete |
| POST | `/customer-list-name-autocomplete` | Customer name autocomplete |
| POST | `/customer-preview` | Customer preview |
| POST | `/trainee-signup` | Trainee registration |
| GET | `/admin_autocomplete` | Admin user autocomplete |
| POST | `/find-affiliate-id` | Find affiliate ID |
| POST | `/user-fetch-by-affiliate_id` | Users by affiliate ID |
| POST | `/user-fetch-by-affiliate_id-count` | Count by affiliate ID |
| POST | `/search-affiliate-id-exist-or-not` | Check affiliate ID availability |
| POST | `/update-affiliate-id` | Update affiliate ID |
| POST | `/fetch-membership-details` | Perennial membership data |
| POST | `/fetch-user-by-id` | Fetch user by ID |
| POST | `/mundane-astrlogy-read-write-access` | Mundane astrology access grant |
| POST | `/check-mundane-access-of-user` | Check mundane access |
| POST | `/add-aditonal-member` | Add perennial family member |
| POST | `/remove_perennial_mandalism_member` | Remove family member |
| POST | `/fetch_perenial_memeber` | Fetch family member |
| POST | `/update_perenial_memeber` | Update family member |
| POST | `/perennial_mandalism_membership-details-fetch` | Fetch perennial membership |
| POST | `/perennial_mandalism_aditonal_member-details-fetch` | Fetch additional members |
| POST | `/click-conversion-report-add-update` | Add click/conversion event |
| POST | `/List-for-click-conversion` | List click conversions |
| POST | `/List-for-click-conversion-count` | Count click conversions |
| POST | `/diviner-name-autocomplete-search` | Diviner name autocomplete |
| POST | `/diviner-email-autocomplete-search` | Diviner email autocomplete |
| POST | `/customer-product-detais-insert` | Insert customer product details |
| POST | `/fetch-customer-product-detais` | Fetch customer product details |
| POST | `/save-customer-astro-responce` | Save customer astro response |
| POST | `/customer-astro-response-details-fetch` | Fetch astro response details |

---

## 3. Calendar Controller — `/calendar`

| Method | Route | Purpose |
|---|---|---|
| POST | `/add-update-events` | Add/update calendar events |
| POST | `/event-list` | List calendar events |
| POST | `/event-list-count` | Count events |
| POST | `/event-single-fetch` | Fetch single event |
| POST | `/status-change` / `/status-changemany` | Change event status |
| POST | `/event-delete` / `/event-deletemany` | Delete event(s) |
| GET | `/get-google-code` | Start Google OAuth flow |
| GET | `/google-authorization` | Google OAuth callback |
| GET | `/generate-daywise-events` | Generate day-wise event slots |
| GET | `/create-appointment-slot` | Create appointment slots |
| GET | `/create-event-slots` | Create event slots |
| POST | `/fetch-event-slots` | Fetch available slots |

---

## 4. Payment Controller — `/payment`

| Method | Route | Purpose |
|---|---|---|
| POST | `/transaction` | Process payment |
| POST | `/fetch-payment-details` | Fetch payment details |
| POST | `/trainee-purchase` | Trainee course purchase |
| POST | `/user-signup-payment-details` | Check signup payment status |
| POST | `/payment-list` | List payments |
| POST | `/payment-list-count` | Count payments |
| POST | `/payment-fetch` | Fetch payment record |
| POST | `/click_report` | Record click event |
| POST | `/payment-refund` | Process refund |
| POST | `/count-transaction-by-affiliate` | Count affiliate transactions |
| POST | `/divination-course-payment` | Divination course payment |
| POST | `/diviner-course-email-process` | Diviner course email |
| POST | `/create-payment-intent` | Create Stripe payment intent |
| POST | `/save-payment-details` | Save payment record |
| POST | `/fetch-tax-data` | Fetch tax rates by location |
| POST | `/create-payment-intent-for-shopping-cart` | Cart checkout payment intent |
| POST | `/webhook` | Stripe payment webhook |

---

## 5. Stripe Controller — `/stripe`

| Method | Route | Purpose |
|---|---|---|
| POST | `/addproduct-details` | Add product to Stripe |
| POST | `/s3-Delete` | Delete file from S3 |
| POST | `/create-subscription-mystery-school` | Create Mystery School subscription |
| GET | `/payment-complete` | Stripe checkout success handler |
| GET | `/default-setup-complete` | Setup intent completion |
| POST | `/mystery-school-transaction` | Mystery School payment record |
| POST | `/mystery-school-email-process` | Mystery School confirmation email |
| POST | `/unsubscribe-stripe-mystery` | Cancel Mystery School subscription |
| GET | `/mystery-subscription-end-update` | Update Mystery subscription end date |
| GET | `/perennial-subscription-end-update` | Update Perennial subscription end date |
| POST | `/unsubscribe-stripe-Perennial` | Cancel Perennial subscription |
| POST | `/donate-now-payment-create` | Create donation payment |
| POST | `/donate-now-transaction` | Record donation transaction |
| POST | `/donate-now-email-process` | Donation confirmation email |
| POST | `/diviner-signup-refund-request-create` | Create diviner refund request |
| POST | `/refund-request-list` | List refund requests |
| POST | `/refund-request-list-count` | Count refund requests |
| POST | `/transaction-list-fetch` | Fetch transactions |
| POST | `/transaction-list-fetch-count` | Count transactions |
| POST | `/refund-request-name-autocomplete` | Requester name autocomplete |

---

## 6. Subscription Controller — `/subscription`

| Method | Route | Purpose |
|---|---|---|
| POST | `/subscribe` | Create subscription / add package |
| POST | `/subscription-list` | List subscriptions |
| POST | `/subscription-list-count` | Count subscriptions |
| POST | `/change-status` | Change subscription status |
| POST | `/delete-subscription` | Delete subscription |
| POST | `/fetch-single-subscription` | Fetch single subscription |
| POST | `/gift-packages` | Gift package to customer |

---

## 7. Training Centre Controller — `/training-centre`

| Method | Route | Purpose |
|---|---|---|
| POST | `/done-training-lesson-add` | Mark lesson complete |
| POST | `/training-centre-list` | List training content for student |
| POST | `/lesson-list` | List lessons for a category |
| POST | `/training-report-percentage` | Get training completion % |
| POST | `/is-trainig-complete` | Check if training complete |
| POST | `/assginment-add` | Submit assignment |
| POST | `/assignment-edit` | Edit assignment submission |
| POST | `/assignment-preview` | Preview assignment |
| POST | `/assignment-status-change` / `/assignment-status-changemany` | Change assignment status |
| POST | `/assignment-list` | List assignments |
| POST | `/assignment-list-count` | Count assignments |
| POST | `/assignment-delete` / `/assignment-deletemany` | Delete assignment(s) |
| POST | `/fetch-assignment` | Fetch single assignment |
| POST | `/assginment-notification-add` | Add assignment notification |
| POST | `/assignment-notification-list` | List notifications |
| POST | `/assignment-notification-list-count` | Count notifications |
| POST | `/fetch-assignment-notification` | Fetch single notification |
| GET | `/calculate-save-training-percentage` | Recalculate + save % |
| POST | `/assignment-add-update` | Add or update assignment |
| POST | `/assignment-single-fetch` | Single assignment fetch |

---

## 8. Tarot Card Controller — `/tarot-card`

| Method | Route | Purpose |
|---|---|---|
| POST | `/tarot-card-add` | Add tarot card |
| POST | `/card-list` | List cards |
| POST | `/card-list-count` | Count cards |
| POST | `/tarot-card-preview` | Preview card |
| POST | `/card-update` | Update card |
| POST | `/tarot-card-edit` | Edit card |
| POST | `/card-status-change` / `/card-status-changemany` | Change card status |
| POST | `/card-delete` / `/card-deletemany` | Delete card(s) |
| GET | `/tarot-card-fetch` | Fetch cards by spread |
| POST | `/tarotcard-list` | List all tarot cards (admin) |
| POST | `/tarotcard-add-update` | Add or update tarot card |
| POST | `/tarotcard-single-fetch` | Single card fetch |
| POST | `/tarotcard-delete` | Delete tarot card |

---

## 9. Tarot Spreads Controller — `/tarot-spreads`

| Method | Route | Purpose |
|---|---|---|
| POST | `/tarot-spread-add` | Add spread template |
| POST | `/tarot-spread-preview` | Preview spread |
| POST | `/spread-list` | List spreads |
| POST | `/spread-list-count` | Count spreads |
| POST | `/spread-delete` / `/spread-deletemany` | Delete spread(s) |
| POST | `/spread-update` | Update spread |
| POST | `/spread-edit` | Edit spread |
| POST | `/spread-status-change` / `/spread-status-changemany` | Change spread status |
| POST | `/spread-add-update` | Add or update spread |
| POST | `/spread-single-fetch` | Single spread fetch |

---

## 10. Tarot Readings Controller — `/tarot-readings`

| Method | Route | Purpose |
|---|---|---|
| POST | `/addupdate-readings` | Add/update reading session |
| POST | `/tarot-readings-list` | List readings |
| POST | `/tarot-readings-list-count` | Count readings |
| POST | `/fetch-tarot-reading` | Fetch single reading |

---

## 11. Ritual Invocation Controller — `/ritual-invocation`

| Method | Route | Purpose |
|---|---|---|
| POST | `/ritual-invocation-add-edit` | Add/edit ritual |
| POST | `/ritual-invocation-list-count` | Count rituals |
| POST | `/ritual-invocation-list` | List rituals |
| POST | `/ritual-invocation-configure-list` | List ritual configurations |
| POST | `/add-ritual-configuration` | Save ritual configuration |
| POST | `/get-ritual-configuration-of-user` | Fetch user's ritual config |
| POST | `/ritual-list` | Fetch ritual list for member |
| POST | `/ritual-list-count` | Count rituals for member |
| POST | `/ritual-details` | Get ritual details |
| POST | `/ritual-invocation-single-fetch` | Single ritual fetch |
| POST | `/ritual-invocation-add-update` | Add or update ritual |
| POST | `/ritual-invocation-delete` | Delete ritual |
| POST | `/ritual-invocation-status-change` | Change ritual status |

---

## 12. Wheel Signs Controller — `/wheel_signs`

| Method | Route | Purpose |
|---|---|---|
| POST | `/add-wheel-signs` | Add wheel sign |
| POST | `/wheel-signs-list` | List wheel signs |
| POST | `/wheel-signs-list-count` | Count wheel signs |
| POST | `/wheel-signs-fetch` | Fetch single wheel sign |
| POST | `/wheel-signs-update` | Update wheel sign |
| POST | `/wheel-signs-delete` / `/wheel-signs-deletemany` | Delete wheel sign(s) |
| POST | `/wheel-signs-status-change` / `/wheel-signs-status-changemany` | Change status |
| POST | `/wheel-sign-autocomplete-fetch` | Autocomplete |
| POST | `/fetch-all-wheel-signs` | Fetch all wheel signs |
| POST | `/wheel-sign-list` | List (admin) |
| POST | `/wheel-sign-list-count` | Count (admin) |
| POST | `/wheel-sign-autocomplete` | Autocomplete search |
| POST | `/wheel-sign-add-update` | Add or update |
| POST | `/wheel-sign-single-fetch` | Single fetch |
| POST | `/astro-decan-info-list` | Decan info list |
| POST | `/astro-decan-info-list-count` | Count decan info |
| POST | `/astro-decan-info-add-update` | Add/update decan info |
| POST | `/single-event-fetch` | Single decan info fetch |
| POST | `/astro-decan-video-pronumcement-list` | Video/pronunciation list |
| POST | `/astro-decan-video-pronumcement-list-count` | Count video list |
| POST | `/astro-decan-video-pronuncement-add-update` | Add/update video |
| POST | `/single-video-pronuncement-fetch` | Single video fetch |
| POST | `/journal-list` | General content (journal) list |
| POST | `/journal-list-count` | Count journal entries |
| POST | `/journal-add-update` | Add/update journal entry |
| POST | `/journal-single-fetch` | Single journal fetch |
| POST | `/sign-autocomplete-search-title` | Sign name autocomplete |
| POST | `/decan-autocomplete-search` | Decan name autocomplete |
| POST | `/demon-autocomplete-search` | Daemon name autocomplete |
| POST | `/journal-auto-complete-addedBy` | Added-by name autocomplete |
| POST | `/decan-list` | Decan list |
| POST | `/decan-list-count` | Count decans |
| POST | `/decan-add` | Add decan |
| POST | `/decan-update` | Update decan |
| POST | `/decan-delete` / `/decan-deletemany` | Delete decan(s) |
| POST | `/decan-status-change` / `/decan-status-changemany` | Change decan status |
| POST | `/decan-autocomplete-fetch` | Decan autocomplete |
| POST | `/fetch-all-decans` | Fetch all decans |
| POST | `/degree-list` | List degrees |
| POST | `/degree-list-count` | Count degrees |
| POST | `/degree-add` | Add degree |
| POST | `/degree-single-fetch` | Fetch degree |

---

## 13. Content Controller — `/content`

| Method | Route | Purpose |
|---|---|---|
| POST | `/content-add` | Add content |
| POST | `/content-update` | Update content |
| POST | `/content-delete` / `/content-deletemany` | Delete content |
| POST | `/content-fetch` | Fetch content |
| POST | `/content-list` | List content |
| POST | `/content-list-count` | Count content |
| GET | `/content-type-counts` | Count by content type |
| POST | `/content-list-for-frontend` | Frontend content list |
| POST | `/content-list-count-for-frontend` | Frontend content count |
| POST | `/content-add-update` | Add or update content |
| GET | `/content-single-fetch` | Single content fetch |

---

## 14. Event Controller — `/event`

| Method | Route | Purpose |
|---|---|---|
| POST | `/event-add` | Add event |
| POST | `/event-list` | List events |
| POST | `/event-list-count` | Count events |
| POST | `/event-update` | Update event |
| POST | `/event-delete` / `/event-deletemany` | Delete event(s) |
| POST | `/event-status-update` / `/event-status-updatemany` | Update event status |
| POST | `/event-autocomplete-search-title` | Autocomplete by title |
| POST | `/event-autocomplete-search-category` | Autocomplete by category |
| POST | `/add-ai-event-process` | AI-generated event |
| POST | `/event-list-displayed-for` | List by audience type |
| POST | `/single-event-fetch` | Fetch single event |
| GET | `/event-slot-process` | Process event slots |
| POST | `/available-event-slot-list` | List available slots |
| POST | `/event-subscription` | Subscribe to event |
| GET | `/event-notification-process` | Process event notifications |
| POST | `/event-add-update` | Add or update event |

---

## 15. Spiritual Wisdom Controller — `/spiritual-wishdom`

| Method | Route | Purpose |
|---|---|---|
| POST | `/add-spiritual-wisdom-data` | Add wisdom content |
| POST | `/spiritual-wisdom-list` | List wisdom |
| POST | `/spiritual-wisdom-list-count` | Count wisdom |
| POST | `/spiritual-wisdom-fetch` | Fetch wisdom |
| POST | `/spiritual-wisdom-update` | Update wisdom |
| POST | `/spiritual-wisdom-delete` / `/spiritual-wisdom-deletemany` | Delete wisdom |
| GET | `/fetch-all-spiritual-wishdom-data` | Fetch all wisdom |
| POST | `/status-change` | Change status |
| POST | `/spiritual-wisdom-fetch-by-id` | Fetch by ID |
| POST | `/add-spiritual-wisdom-videos` | Add wisdom videos |
| POST | `/spiritual-wisdom-videos-list` | List videos |
| POST | `/spiritual-wisdom-videos-list-count` | Count videos |
| POST | `/fetch-spiritual-wisdom-videos` | Fetch videos |
| POST | `/spiritual-wisdom-videos-update` | Update videos |
| POST | `/spiritual-wisdom-videos-delete` / `/spiritual-wisdom-videos-deletemany` | Delete videos |
| POST | `/spiritual-videos-status-change` | Change video status |
| POST | `/spiritual-wisdom-add-update` | Add or update (text) |
| POST | `/spiritual-wisdom-single-fetch` | Single wisdom fetch |
| POST | `/spiritual-youtube-add-update` | Add or update (YouTube) |
| POST | `/spiritual-youtube-single-fetch` | Single YouTube fetch |

---

## 16. Notes Controller — `/notes`

| Method | Route | Purpose |
|---|---|---|
| POST | `/listnotedata` | List notes for customer |
| POST | `/addnotedata` | Add note |
| POST | `/editnotedata` | Edit note |
| POST | `/deletenotedata` | Delete note |

---

## 17. Webinar Controller — `/webinar`

| Method | Route | Purpose |
|---|---|---|
| POST | `/webinar-add` | Add webinar |
| POST | `/webinar-preview` | Preview webinar |
| POST | `/webinar-update` | Update webinar |
| POST | `/webinar-delete` / `/webinar-deletemany` | Delete webinar(s) |
| POST | `/webinar-list-count` | Count webinars |
| POST | `/webinar-list` | List webinars |
| POST | `/webinar-status-change` / `/webinar-status-changemany` | Change status |
| POST | `/webinar-edit` | Edit webinar |
| GET | `/fetch-all-webinar` | Fetch all webinars |
| POST | `/webinar-add-update` | Add or update webinar |
| GET | `/webinar-single-fetch` | Single webinar fetch |

---

## 18. Video Management Controller — `/videomanagement`

| Method | Route | Purpose |
|---|---|---|
| POST | `/video-add` | Add video |
| POST | `/video-edit` | Edit video |
| POST | `/video-management-delete` / `/video-management-deletemany` | Delete video(s) |
| POST | `/video-status-change` / `/video-status-changemany` | Change status |
| POST | `/video-title-autocomplete` | Autocomplete title |
| POST | `/video-list` | List videos |
| POST | `/video-list-count` | Count videos |
| POST | `/video-data-fetch` | Fetch video |
| POST | `/video-list-for-front-end` | Frontend video list |
| POST | `/list-for-front-end` | Frontend list |

---

## 19. Broadcasting Controller — `/brodcasting`

| Method | Route | Purpose |
|---|---|---|
| POST | `/brodcasting-data-add` | Add broadcast |
| POST | `/brodcasting-delete` / `/brodcasting-deletemany` | Delete broadcast(s) |
| POST | `/brodcasting-status-change` / `/brodcasting-status-changemany` | Change status |
| POST | `/brodcasting-edit` | Edit broadcast |
| POST | `/brodcasting-autocomplete` | Title autocomplete |
| POST | `/brodcasting-list` | List broadcasts |
| POST | `/brodcasting-list-count` | Count broadcasts |
| POST | `/brodcast-data-fetch` | Fetch broadcast |
| POST | `/Brodcasting-list-for-front-end` | Frontend list |

---

## 20. Package Controller — `/package`

| Method | Route | Purpose |
|---|---|---|
| POST | `/package-add` | Add package |
| POST | `/package-list` | List packages |
| POST | `/package-list-count` | Count packages |
| POST | `/package-preview` | Preview package |
| POST | `/package-update` | Update package |
| POST | `/package-edit` | Edit package |
| POST | `/package-status-change` / `/package-status-changemany` | Change status |
| POST | `/package-delete` / `/package-deletemany` | Delete package(s) |
| POST | `/fetch-all-package` | Fetch all (dropdown) |
| POST | `/package-autocomplete` | Autocomplete |
| POST | `/fetch-all-package-for-list` | Fetch for list |
| POST | `/get-package-by-id-details` | Get by ID |
| POST | `/fetch-package-access` | Check access |
| POST | `/fetch-purchased-packages` | Customer's purchased packages |
| POST | `/change-status` | Change package status |
| POST | `/delete-package` | Delete package |
| POST | `/package-add-update` | Add or update |
| POST | `/package-single-fetch` | Single package fetch |

---

## 21. Product Category Controller — `/product_category`

| Method | Route | Purpose |
|---|---|---|
| POST | `/product-category-add` | Add category |
| POST | `/product-category-list` | List categories |
| POST | `/product-category-list-count` | Count categories |
| POST | `/product-category-fetch` | Fetch category |
| POST | `/product-category-update` | Update category |
| POST | `/product-category-delete` / `/product-category-deletemany` | Delete category(ies) |
| POST | `/product-category-status-change` / `/product-category-status-changemany` | Change status |
| POST | `/product-category-edit` | Edit category |
| POST | `/fetch-all-product-category` | Fetch all (dropdown) |
| POST | `/product-category-autocomplete` | Autocomplete |
| POST | `/fetch-product-category-for-form` | Fetch for form |

---

## 22. Product Management Controller — `/product_management`

| Method | Route | Purpose |
|---|---|---|
| POST | `/product-management-add` | Add product |
| POST | `/product-management-list` | List products |
| POST | `/product-management-list-count` | Count products |
| POST | `/product-management-fetch` | Fetch product |
| POST | `/product-management-update` | Update product |
| POST | `/product-management-delete` / `/product-management-deletemany` | Delete product(s) |
| POST | `/product-management-status-change` / `/product-management-status-changemany` | Change status |
| POST | `/product-management-edit` | Edit product |
| POST | `/fetch-all-product-management` | Fetch all |
| POST | `/product-management-autocomplete` | Autocomplete |
| POST | `/get-product-by-category` | Get by category |
| POST | `/get-product-by-id-details` | Get by ID |
| POST | `/product-management-list-for-front-end` | Frontend list |
| POST | `/product-management-list-for-admin` | Admin list |
| POST | `/fetch-product-management-for-form` | Fetch for form |
| POST | `/product-management-edit-for-admin` | Admin edit |
| POST | `/update-product-quantity` | Update stock quantity |
| POST | `/product-management-fetch-for-front-end` | Frontend fetch |
| POST | `/fetch-last-printify-sync-time` | Last Printify sync time |

---

## 23. Cart Controller — `/cart`

| Method | Route | Purpose |
|---|---|---|
| POST | `/cart-add` | Add item to cart |
| POST | `/cart-list` | List cart items |
| POST | `/cart-list-count` | Count cart items |
| POST | `/cart-fetch` | Fetch cart |
| POST | `/cart-update` | Update cart |
| POST | `/cart-delete` / `/cart-deletemany` | Delete cart item(s) |
| POST | `/cart-clear` | Clear entire cart |
| POST | `/cart-list-for-checkout` | Cart items for checkout |
| POST | `/cart-item-increase` | Increase item quantity |
| POST | `/cart-item-decrease` | Decrease item quantity |
| POST | `/fetch-cart-items-for-front-end` | Frontend cart |
| POST | `/cart-validation` | Validate cart items |
| POST | `/save-cart-items` | Save cart state |
| POST | `/save-applied-coupon` | Apply coupon code |
| POST | `/remove-applied-coupon` | Remove coupon |
| POST | `/get-applied-coupon` | Get applied coupon |
| POST | `/cart-recalculate` | Recalculate cart totals |
| POST | `/quick-checkout` | Quick checkout |
| POST | `/cart_data_count` | Get cart item count (header badge) |
| POST | `/order-list` | Order history list |
| POST | `/order-list-count` | Count orders |
| POST | `/order-preview` | Preview order |
| POST | `/Resend-mail-invoice-pdf-by-orderid` | Resend invoice email |

---

## 24. Cart Management Controller — `/cart_management`

| Method | Route | Purpose |
|---|---|---|
| POST | `/subscription-payment` | Perennial/Mystery subscription payment |
| POST | `/order-list` | List orders |
| POST | `/order-list-count` | Count orders |
| POST | `/order-preview` | Order preview |
| POST | `/Resend-mail-invoice-pdf-by-orderid` | Resend invoice PDF |

---

## 25. Refund Processing Controller — `/refund-processing`

| Method | Route | Purpose |
|---|---|---|
| POST | `/refund-processing-list` | List refund requests |
| POST | `/refund-processing-list-count` | Count refund requests |
| POST | `/add-comment` | Add comment to refund |
| GET | `/get-comments/:request_id` | Get refund comments |
| POST | `/approve-refund` | Approve refund |
| POST | `/reject-refund` | Reject refund |
| POST | `/user-name-autocomplete-search` | Customer name autocomplete |
| POST | `/check-refund-request-products-history` | Check product refund history |
| POST | `/shopping-refund-request-create` | Create shopping refund request |

---

## 26. Refund Activity Controller — `/refund-activity`

| Method | Route | Purpose |
|---|---|---|
| POST | `/refund-activity-add` | Add refund activity log entry |
| POST | `/refund-activity-list` | List refund activities |
| POST | `/refund-activity-fetch` | Fetch activity |

---

## 27. Report Controller — `/report`

| Method | Route | Purpose |
|---|---|---|
| POST | `/report-list` | List reports |
| POST | `/report-list-count` | Count reports |

---

## 28. Quarter Management Controller — `/quatermanagement`

| Method | Route | Purpose |
|---|---|---|
| POST | `/quater_dropdown` | Quarter dropdown list |
| POST | `/add_class_config` | Add class configuration |
| POST | `/edit_class_config` | Edit class configuration |
| POST | `/class_list` | List classes |
| POST | `/class_delete` | Delete class |
| POST | `/edit_class_data/:id` | Fetch class for edit |
| POST | `/class_add_update` | Add or update class |

---

## 29. Social Advo Controller — `/social-advo`

| Method | Route | Purpose |
|---|---|---|
| POST | `/social-advo-add-update` | Add/update social advo post |
| POST | `/social-advo-list` | List posts |
| POST | `/social-advo-list-count` | Count posts |
| POST | `/social-advo-status-change` | Change status |
| POST | `/social-advo-deletemany` | Bulk delete |
| GET | `/social-advo-single-fetch` | Single post fetch |
| POST | `/social-accounts` | List social accounts |

---

## 30. Conference Room Controller — `/conference-room`

| Method | Route | Purpose |
|---|---|---|
| POST | `/meeting-details-list` | List meeting sessions |
| POST | `/meeting-details-list-count` | Count sessions |
| POST | `/meeting-recording-token-verification` | Verify recording access token |
| POST | `/attendee-autocomplete-search` | Attendee name autocomplete |

---

## 31. Ingress Chart Controller — `/ingress-charts`

| Method | Route | Purpose |
|---|---|---|
| POST | `/get-ingress-chart-by_id` | Fetch ingress chart by ID |
| POST | `/ingress-chart-add` | Add chart |
| POST | `/ingress-chart-list` | List charts |
| POST | `/ingress-chart-list-count` | Count charts |
| POST | `/ingress-chart-fetch` | Fetch chart |
| POST | `/ingress-chart-update` | Update chart |
| POST | `/ingress-chart-delete` / `/ingress-chart-deletemany` | Delete chart(s) |
| POST | `/ingress-chart-status-change` / `/ingress-chart-status-changemany` | Change status |

---

## 32. Testimonial Controller — `/testimonial`

| Method | Route | Purpose |
|---|---|---|
| POST | `/testimonial-add` | Add testimonial |
| POST | `/testimonial-list` | List testimonials |
| POST | `/testimonial-list-count` | Count testimonials |
| POST | `/testimonial-fetch` | Fetch testimonial |
| POST | `/testimonial-update` | Update testimonial |
| POST | `/testimonial-delete` / `/testimonial-deletemany` | Delete testimonial(s) |
| POST | `/testimonial-status-change` / `/testimonial-status-changemany` | Change status |
| POST | `/testimonial-edit` | Edit testimonial |
| GET | `/fetch-all-testimonials` | Fetch all |

---

## 33. User Profile Controller — `/user-profile`

| Method | Route | Purpose |
|---|---|---|
| POST | `/fetch-profile-by-unique-name` | Public profile by unique name |
| POST | `/fetch-profile` | Private profile fetch |
| POST | `/request-bucket-url` | Get S3 presigned upload URL |
| POST | `/delete-image-from-bucket` | Delete file from S3 |
| POST | `/profile-add` | Add profile |
| POST | `/profile-update` | Update profile |

---

## 34. Blog Management Controller — `/blogmanagement`

| Method | Route | Purpose |
|---|---|---|
| POST | `/blog-add` | Add blog post |
| POST | `/blog-edit` | Edit blog post |
| POST | `/blog-list` | List blog posts |
| POST | `/blog-list-count` | Count blog posts |
| POST | `/blog-list-title-autocomplete` | Title autocomplete |
| POST | `/blog-status-change` | Change status |
| POST | `/blog-management-deletemany` | Bulk delete |
| POST | `/blog-management-delete` | Delete single |
| GET | `/fetch-all-Blog-category-details-data` | Fetch blog categories |

---

## 35. Astro AI Controller — `/astro-ai`

| Method | Route | Purpose |
|---|---|---|
| POST | `/ai-analysis` | AI astrology analysis |
| POST | `/ai-predictions` | AI predictions |
| POST | `/ai-chart-interpretation` | AI chart interpretation |
| POST | `/ai-transit-analysis` | AI transit analysis |
| POST | `/ai-compatibility` | Compatibility analysis |
| POST | `/ai-forecast` | Forecast generation |
| POST | `/ai-report-generate` | Generate AI report |
| POST | `/ai-insights` | AI insights |
| POST | `/ai-daily-horoscope` | Daily horoscope |
| POST | `/ai-chat` | AI chat interface |
| POST | `/ai-dream-interpretation` | Dream interpretation |

---

## 36. Membership Controller — `/membership`

| Method | Route | Purpose |
|---|---|---|
| POST | `/membership-upgrade` | Upgrade membership tier |

---

## 37. Spiritual Wisdom Videos — (under `/spiritual-wishdom`)

See entries under Spiritual Wisdom Controller (#15).

---

## 38. Stock Management Controller — `/stock_management`

| Method | Route | Purpose |
|---|---|---|
| POST | `/stock-add` | Add stock record |
| POST | `/stock-list` | List stock |
| POST | `/stock-update` | Update stock |
| POST | `/stock-delete` | Delete stock |

---

## 39. WhatsApp Listener Controller — `/whatsapplistner`

| Method | Route | Purpose |
|---|---|---|
| POST | `/webhook` | WhatsApp webhook receiver |

---

## 40. Video Gallery Controller — `/videogallery`

| Method | Route | Purpose |
|---|---|---|
| POST | `/list` | List video gallery items |
| POST | `/list-count` | Count items |
| POST | `/video-status-change` | Change video status |
| POST | `/video-delete` | Delete video |
| GET | `/autocomplete-vieo-title` | Video title autocomplete |

---

## 41. Mystery School Controller — `/mystery-school`

| Method | Route | Purpose |
|---|---|---|
| POST | `/add-signup` | Add mystery school enrollment |
| POST | `/update-signup` | Update enrollment |

---

## 42. Astro Toolkit / Decan New Infos — `/astro_decan_new_infos`

| Method | Route | Purpose |
|---|---|---|
| GET | `/get-astro-toolkit` | Fetch astro toolkit keys |

---

## External APIs Used by Angular

| Service | Base URL | Purpose |
|---|---|---|
| Calendar Lambda (primary) | `https://i526y91jwg.execute-api.us-east-2.amazonaws.com/dev/` | Google Calendar slots, bookings, events |
| Calendar Lambda (alt) | `https://m9mkuic6o9.execute-api.us-east-1.amazonaws.com/dev/` | Calendar add events |
| VideoSDK | `https://api.videosdk.live/v2/rooms` | Create conference rooms |
| PositionStack | `http://api.positionstack.com/v1/forward` | Geocoding / location lookup |
| ipify | `https://api.ipify.org?format=json` | Get client public IP |
| ipinfo | `https://ipinfo.io/{IP}?token=...` | IP geolocation |
| External Astrology | `https://json.astrologyapi.com/v1/` | Horoscope / astrology data |
| AI Astrology Lambda | `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws` | AI astrology processing |
