const _ = require("lodash");
const data = require("../../../data/data");
const importPackage = require("../../../modules/mysql/importPackage");
let db;
let config;
let checkExists;
let checkTotalEmiDuration;
let tempItem;
let failedPackages;
let parent;
let fetchPackageID;
async function getImportPackage(req, res) {
    try {
        var dataxl = req.body;
        var invalid;
        config = req.app.get("config");
        db = req.app.get("db");
        failedPackages = [];

        for (var i = 0; i < dataxl.length; i++) {
            var item = dataxl[i];

            checkExists = 0;
            invalid = false;

            tempItem = Object.create(
                Object.getPrototypeOf(item),
                Object.getOwnPropertyDescriptors(item)
            );

           // check assortment in course
            checkExists = await importPackage.filterAssortment(
                db.mysql.read,
                item
            ); 

            //check assortment exists in course
            if (checkExists[0].count == 0) {
                tempItem.error = "Assortiment id not found in course details.";
                invalid = true;
            }

            if(item.is_default == null){
                tempItem.error = "Default value not found";
                invalid = true;
            }
           
            //remove element if assortment_id, duration and type combination is already exists
            if (invalid == false && item.type == "subscription" && item.mode == 1) {
                checkExists = 0;
                checkExists = await importPackage.filterSubscription(
                    db.mysql.read,
                    item
                );
                if (checkExists[0].count) {
                    tempItem.error =
                        "The assorment id, duration and type combination of this package already exists.";
                    invalid = true;
                }
            } else if (invalid == false && item.type == "subscription" && item.mode == 2) {
              
                checkExistsSubscriptionModeTwo = 0;
                checkExistsSubscriptionModeTwo = await importPackage.filterSubscriptionModeTwo(
                    db.mysql.read,
                    item
                );

                       
               // if(checkExistsSubscriptionModeTwo.length != 0){
                    fetchPackageID = checkExistsSubscriptionModeTwo[0].id;
                    //condition to check emi exists
                    if (checkExistsSubscriptionModeTwo.length != 0) {
                        checkVariantsExists = await importPackage.checkVariantsExistsEmi(
                            db.mysql.read,
                            fetchPackageID,
                            item.base_price,
                            item.display_price
                        );
                        if(checkVariantsExists.length != 0){
                            tempItem.error = "The Subscription Variant already exists.";
                            invalid = true;
                        }else{
                            var variant = {
                                package_id: fetchPackageID,
                                base_price:item.base_price,
                                display_price: item.display_price,
                            };
                            var variantResponse = await importPackage.insertVariant(
                                db.mysql.write,
                                variant
                            );
                        }

                    } else {
                        tempItem.error = "The package does not exists.";
                        invalid = true;
                    }
                // }else{
                //     tempItem.error = "The package already exists.";
                //     invalid = true;
                // }
                    
            }

            //filter emi
            //if only type is emi
            if (invalid == false && item.type == "emi" && item.mode == 1) {
                checkExists = 0;
                //check emi exists
                checkExists = await importPackage.filterEmi(
                    db.mysql.read,
                    item
                );
               
                //condition to check emi exists
                if (checkExists.length == 0) {
                    checkTotalEmiDuration = 0;
                    //if parent emi
                    if (
                        item.emi_duration == null &&
                        item.emi_amount == null &&
                        item.type == "emi"
                    ) {
                        //store data related to parent emi
                         parent = {
                            sr: item.sr,
                            assortment_id: item.assortment_id,
                            duration_in_days: item.duration_in_days,
                            total_emi: item.total_emi,
                            child_sr: [],
                        };
                      
                        //perform actions on child emi
                        for (
                            var j = parseInt(item.sr);
                            j < parseInt(item.total_emi + item.sr);
                            j++
                        ) {
                            var item2 = dataxl[j];
                            if (
                                item.assortment_id == item2.assortment_id &&
                                item.duration_in_days ==
                                    item2.duration_in_days &&
                                item.total_emi == item2.total_emi
                            ) {
                                checkTotalEmiDuration += item2.emi_duration;
                                parent.child_sr.push(item2.sr);
                            }
                        }


                        //else if child emi
                    } else if (
                        //check for child of related parent only
                        item.emi_duration != null &&
                        item.emi_amount != null &&
                        item.type == "emi" &&
                        parent.assortment_id == item.assortment_id &&
                        parent.duration_in_days == item.duration_in_days &&
                        parent.total_emi == item.total_emi &&
                        parent.child_sr.includes(item.sr)
                    ) {
                        //manipulate value when child emi comes then in
                        // checkTotalEmiDuration will have value of parent duration_in_days
                        checkTotalEmiDuration = parent.duration_in_days;
                    } else {
                        parent = {
                            sr: null,
                            assortment_id: null,
                            duration_in_days: null,
                            total_emi: null,
                            child_sr: [],
                        };
                        checkTotalEmiDuration = 0;
                    }
                    //compare total duration is equal to total of emi duration
                    if (item.duration_in_days != checkTotalEmiDuration) {
                        tempItem.error =
                            "Total child emi duration is not equal to parent emi duration.";
                        invalid = true;
                    }
                } else {
                    tempItem.error = "The emi package already exists.";
                    invalid = true;
                }

            } else if(invalid == false && item.type == "emi" && item.mode == 2 && item.package_id != null){
           //  console.log('inside the package_id loop 1');
                checkExistsEmiModeTwo = 0;
                //check emi exists
                checkExistsEmiModeTwo = await importPackage.filterEmiModeTwo(
                    db.mysql.read,
                    item
                );
                
                    //condition to check emi exists
                    if(checkExistsEmiModeTwo.length == 0){
                       // console.log('inside the package_id loop 2');
                        tempItem.error = "The package already exists.";
                        invalid = true;
                    }else{
                       
                    if (checkExistsEmiModeTwo.length != 0) {
                      //  console.log('inside the package_id loop 4');
                        fetchPackageID = checkExistsEmiModeTwo[0].id;
                        checkVariantsExists = await importPackage.checkVariantsExistsEmi(
                            db.mysql.read,
                            item.package_id,
                            item.base_price,
                            item.display_price
                        );
       
                        if(checkVariantsExists.length != 0){
                            tempItem.error = "The emi Variant already exists.";
                            invalid = true;
                        }else{
                            var variant = {
                                package_id: fetchPackageID,
                                base_price:item.base_price,
                                display_price: item.display_price,
                            };
                            var variantResponse = await importPackage.insertVariant(
                                db.mysql.write,
                                variant
                            );
                        }

                    } else {
                        tempItem.error = "The emi package already exists.";
                        invalid = true;
                    }
                }
            } else if(invalid == false && item.type == "emi" && item.mode == 2){
                    checkExistsEmiModeTwo = 0;
                    //check emi exists
                    checkExistsEmiModeTwo = await importPackage.filterEmiModeTwo(
                        db.mysql.read,
                        item
                    );
                    
                    if(checkExistsEmiModeTwo.length == 0){
                        } else {
                            tempItem.error = "The emi package already exists.";
                            invalid = true;
                        }
                } 

            if (invalid == false) {
                // item.is_show_panel = 1;
                item.is_active = 0;
                // item.is_show = 0;
                if(item.mode == 1){
                    var package = Object.create(
                        Object.getPrototypeOf(item),
                        Object.getOwnPropertyDescriptors(item)
                    );
                    delete package.base_price;
                    delete package.sr;
                    delete package.display_price;
                    delete package.reference_type;
                    delete package.mode;
                    delete package.package_id;                   ;

                    var packageResponse = await importPackage.insertPackage(
                        db.mysql.write,
                        package
                    );
                    var variant = {
                        package_id: packageResponse.insertId,
                        base_price: item.base_price,
                        display_price: item.display_price,
                    };

                    var variantResponse = await importPackage.insertVariant(
                        db.mysql.write,
                        variant
                    );
                }
                   
                var insertedItem = Object.create(
                    Object.getPrototypeOf(item),
                    Object.getOwnPropertyDescriptors(item)
                );

                if (item.type == "emi" && item.reference_type == "v3") {
                    var findMasterParentVariant = await importPackage.findMasterParentVariant(
                        db.mysql.read,
                        insertedItem
                    );

                    if (
                        typeof findMasterParentVariant[0] !== "undefined" &&
                        findMasterParentVariant[0].id
                    ) {
                        if(typeof variantResponse === 'undefined'){
                            tempItem.error = "The package already exists.";
                            invalid = true;
                        }else{
                            var addMasterParent = {
                                id: variantResponse.insertId,
                                master_parent_variant_id:
                                findMasterParentVariant[0].id,
                            };
                            var findMasterParentVariant = await importPackage.addMasterParentVariant(
                                db.mysql.read,
                                addMasterParent
                            );
                        }
                    }
                }
            } else {
                failedPackages.push(tempItem);
            }
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: "SUCCESS",
            },
            data: failedPackages,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

// async function getImportVariant(req, res) {
//     try {
//         var dataxl = req.body;
//         var data = [];
//         failedPackages = [];
//         config = req.app.get("config");
//         db = req.app.get("db");

//         for (var i = 0; i < dataxl.length; i++) {
//             var item = dataxl[i];
//             checkExists = 0;
//             checkExists = await checkVariant(req, res, item);
//             if (checkExists > 0) {
//                 tempItem = Object.create(
//                     Object.getPrototypeOf(item),
//                     Object.getOwnPropertyDescriptors(item)
//                 );
//                 tempItem.error = "The variant already exists.";
//                 failedPackages.push(tempItem);
//             } else {
//                 data.push(item);
//             }
//         }

//         formatedData = data.map(function (xlData) {
//             return Object.values(xlData);
//         });

//         console.log(formatedData.length + "-" + "check");

//         let response;
//         if (formatedData.length) {
//             // response = await importPackage.insertVariant(
//             //     db.mysql.write,
//             //     formatedData
//             // );

//             for (var j = 0; j < data.length; j++) {
//                 var item = data[j];
//                 console.log(item);

//                 if (
//                     typeof item.master_child !== "undefined" &&
//                     item.master_child !== null
//                 ) {
//                     console.log(1);
//                     var checkChild = item.master_child.split("_");
//                     if (checkChild[0] == "C") {
//                         for (var k = 0; k < data.length; k++) {
//                             var addMasterParentVariant = {};
//                             var item2 = data[k];
//                             if (
//                                 typeof item2.master_child !== "undefined" &&
//                                 item2.master_child !== null
//                             ) {
//                                 console.log(2);
//                                 var checkMaster = item2.master_child.split("_");
//                                 if (
//                                     checkMaster[0] == "M" &&
//                                     checkMaster[1] == checkChild[1]
//                                 ) {
//                                     addMasterParentVariant.master_parent_variant_id = {
//                                         id: item.id,
//                                         master_parent_variant_id: item2.id,
//                                     };

//                                     console.log(addMasterParentVariant);
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }
//         } else {
//             response = "";
//         }

//         console.log("end");

//         const responseData = {
//             meta: {
//                 code: 200,
//                 success: true,
//                 message: "SUCCESS",
//             },
//             data: response,
//         };
//         return res.status(responseData.meta.code).json(responseData);
//     } catch (e) {
//         console.log(e);
//     }
// }

module.exports = {
    getImportPackage,
    // getImportVariant,
};
