/**
 * @swagger
 * definition:
 *   user:
 *     type: object
 *     properties:
 *        student_id:
 *                    description: Student Id
 *                    type: integer
 *                    example: 1111130
 *        fb_id:
 *                    description: Student Facebook Id
 *                    type: integer
 *                    example: 11223412
 *        gcm_reg_id:
 *                    description: Student device gcm_reg_id
 *                    type: string
 *                    example: 1D0N7KN0W
 *        iphone_udid:
 *                    description: Student Iphone Udid
 *                    type: string
 *                    example: 1D0N7KN0W
 *        student_fname:
 *                    description: Student First Name
 *                    type: string
 *                    example: Munni
 *        student_lname:
 *                    description: Student Last Name
 *                    type: string
 *                    example: XesLoohc
 *        exam_board:
 *                    description: Student Exam Board
 *                    type: string
 *                    example: CBSE
 *        mobile:
 *                    description: Student Phone Number
 *                    type: string
 *                    example: 9535037239
 *        country_code:
 *                    description: Country code for Phone Number
 *                    type: String
 *                    example: +91
 *        pincode:
 *                    description: Student Address Pincode
 *                    type: integer
 *                    example: 110028
 *        device_type:
 *                    description: Device Type of Student
 *                    type: String
 *                    example: Mobile
 *        hashed_password:
 *                    description: Hashed Password
 *                    type: string
 *                    example: 112c12as2121
 *        email_varification_code:
 *                    description: email Varification code
 *                    type: integer
 *                    example: 232451
 *        mobile_verification_code:
 *                    description: mobile verification code
 *                    type: integer
 *                    example: 1111
 *        is_email_verified:
 *                    description: Email Verification Flag
 *                    type: boolean
 *                    example: true
 *        is_mobile_verfied:
 *                    description:  is_mobile_verfied flag
 *                    type: boolean
 *                    example: true
 *        status:
 *                    description: Student Active Status Flag
 *                    type: string
 *                    example: active
 *        reset_code:
 *                    description: Student reset_code
 *                    type: string
 *                    example:
 *        last_login:
 *                    description: Student Last Login Time Stamp
 *                    type: date
 *                    example: 2018-08-16T15:11:29.000Z
 *        timestamp:
 *                    description: timestamp
 *                    type: date
 *                    example: 2018-08-16T15:11:29.000Z
 *        is_online:
 *                    description: Student Online Availabilty Flag
 *                    type: boolean
 *                    example: true
 *        student_class:
 *                    description: Student Class group
 *                    type: string
 *                    example: 12
 *        referral_code:
 *                    description: Student On Board By Referral Code
 *                    type: string
 *                    example: XesRef123
 *        udid:
 *                    description: Student Device Udid
 *                    type: string
 *                    example: qweqd2213124asas
 *        primary_user:
 *                    description: primary_user
 *                    type: string
 *                    example: qweqd2213124asas
 *        app_version:
 *                    description: app_version
 *                    type: string
 *                    example: qweqd2213124asas
 *        fingerprints:
 *                    description: fingerprints
 *                    type: string
 *                    example: qweqd2213124asas
 *        is_uninstalled:
 *                    description: is_uninstalled
 *                    type: boolean
 *                    example: false
 *        is_web:
 *                    description: is_web
 *                    type: boolean
 *                    example: true
 *        locale:
 *                    description: locale
 *                    type: string
 *                    example: en
 *        is_dropped:
 *                    description: is_dropped
 *                    type: boolean
 *                    example: false
 *        student_username:
 *                    description: student user name
 *                    type: string
 *                    example: xesloohc
 *        is_new_app:
 *                    description: is_new_app
 *                    type: boolean
 *                    example: false
 *        coaching:
 *                    description: coaching
 *                    type: string
 *                    example: XesLoohc Academy of ESports Excellence
 *        dob:
 *                    description: Date of birth of student
 *                    type: date
 *                    example: 12/9/91
 *
 *   postAdd:
 *     type: object
 *     properties:
 *        text:
 *                    description: Text Inserted By Student
 *                    type: string
 *                    example: Cool Message To Share
 *        type:
 *                    description: Type Of Share Material
 *                    type: string
 *                    enum: [Tips&Trick,Meme,JustAThought,BrainTwister,DuelAFriend]
 *                    example: Cool Message To Share
 *        url:
 *                    description: Url Shared By Student
 *                    type: string
 *                    format: url
 *                    example: Cool Message To Share
 *   post:
 *     type: object
 *     properties:
 *        student_username:
 *                    description: User Username
 *                    type: string
 *                    example: XesLoohc
 *        profile_image:
 *                    description: Url Of User Avatar
 *                    type: string
 *                    format: url
 *                    example: http://test.doubtnut.com/images/xesloohc.png
 *        id:
 *                    description: UGC Post Id
 *                    type: string
 *                    example: 23122dasd123sadasfasfqafasf
 *        type:
 *                    description: Type Of Share Material
 *                    type: string
 *                    enum: [Tips&Trick,Meme,JustAThought,BrainTwister,DuelAFriend]
 *                    example: Cool Message To Share
 *        text:
 *                    description: Text Entered By User
 *                    type: string
 *                    example: This is iN My Mind
 *        video:
 *                    description: Video S3 Url uploaded By Student
 *                    type: string
 *                    format: url
 *                    example: http://s3.bucket/video/uploaded1.mp4
 *        image:
 *                    description: Image S3 Url Uploaded By Student
 *                    type: string
 *                    format: url
 *                    example: http://s3.bucket/image/uploaded1.png
 *        audio:
 *                    description: Audio S3 Url Uploaded By Student
 *                    type: string
 *                    format: url
 *                    example: http://s3.bucket/audio/uploaded1.mp3
 *        created_at:
 *                    description: Created Date
 *                    type: date
 *                    example: 2011-10-05T14:48:00.000Z
 *        top_comment:
 *                    description: Array Of Top Comment
 *                    type: array
 *                    example: #todo
 *        comments_count:
 *                    description: Total Count of Comment On this Post
 *                    type: number
 *                    example: 0
 *        like_count:
 *                    description: like Count On this Post
 *                    type: number
 *                    example: 0
 *        is_like:
 *                    description: Is Liked By Logged In User
 *                    type: boolean
 *                    example: 0
 *
 *   postUpload:
 *     type: array
 *     properties:
 *        image:
 *                    description: Image File
 *                    type: string
 *                    format: binary
 *        audio:
 *                    description: audio File
 *                    type: string
 *                    format: binary
 *        video:
 *                    description: video File
 *                    type: string
 *                    format: binary
 */
