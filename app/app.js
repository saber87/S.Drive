const electron = require('electron')
const url = require('url');
const fs = require('fs-extra');
const path = require('path');
var isPortReachable = require("is-port-reachable");
var networkDrive = require("windows-network-drive");
const { app, BrowserWindow, Menu, ipcMain } = electron;



$(document).ready(function () {

    var successState = `<img src="assets/icons/check.png" role="img" alt="" width="20" height="20" title="Success">`;
    var failState = `<img src="assets/icons/fail.png" role="img" alt="" width="16" height="16" title="Fail">`;
    var unknownState = `<img src="assets/icons/question-circle.svg" role="img" alt="" width="16" height="16" title="Unknown">`;
    var nowChecking = '<div class="spinner-border text-primary text-center spinner-border-sm" role="status"><span class="sr-only">Loading...</span></div>';
    var disconnected = `<img src="assets/icons/disconnect.png" role="img" alt="" width="16" height="16" title="Unmount">`;
    var connected = `<img src="assets/icons/connect.png" role="img" alt="" width="16" height="16" title="Unmount">`;

    //Default.json 자동 불러오기
    try {

        $("table tbody tr").remove();

        const contents = fs.readFileSync(path.join(__dirname, "default.json"), 'utf8')
        var jsonContent = JSON.parse(contents)


        jsonToHtmlTable(jsonContent, '#urltable');

        var i = 0;
        $("tr").find("td:first").each(function (i) {

            $(this).html(i + 1);

        });

        $('#urltable > thead > tr').each(function () {
            $(this).closest('tr').find('th:eq(5)').css("font-size", "0%")
        });



        // Set the html for the select box, edit attributes, and default status
        $('#urltable > tbody > tr').each(function () {
            // Add input box
            $(this).closest('tr').find('td:eq(1)').html(`<input type="checkbox" name="record"></input>`);
            $(this).closest('tr').find('td:eq(5)').css("font-size", "0%")

            // set content editable state
            //$(this).closest('tr').find('td:eq(2)').addClass("edit").attr("true");;
            //$(this).closest('tr').find('td:eq(3)').addClass("edit").attr("true");;

            $(this).closest('tr').find('td:eq(7)').html(unknownState);
            $(this).closest('tr').find('td:eq(8)').html(unknownState);
        });
        //console.log(data)
    } catch (err) {
        console.error(err)
    }

    list_drive();

    list_check();

    run_check();

    $('#carousel-nav').carousel('pause')

    // 자동 실행 함수
    
    $("#detect-button").click(function(e){

        
        if($("#detect-button").is(":checked")){
            console.log("checked");
            $("#collapseTemplate").collapse('hide')
            $("#collapseCustom").collapse('hide')
            $("#collapseDetect").collapse('show')


            //list_check();
            $('body').css('background','#eee');
            $('#custom-button').attr('disabled',true);
            $('#template-button').attr('disabled',true);
            $('#mount-button').attr('disabled',true);
            $('#unmount-button').attr('disabled',true);
            $('#clear-button').attr('disabled',true);
            $('#clear-all').attr('disabled',true);
            $('#carousel-nav').carousel(1)
            //run_check();
            
            detectstart();

        }
        else{
            console.log("unchecked");
            $("#collapseDetect").collapse('hide')
            $("#collapseCustom").collapse('show')


            $('body').css('background','#fff');
            $('#custom-button').attr('disabled',false);
            $('#template-button').attr('disabled',false);
            $('#mount-button').attr('disabled',false);
            $('#unmount-button').attr('disabled',false);
            $('#clear-button').attr('disabled',false);
            $('#clear-all').attr('disabled',false);
            $('#carousel-nav').carousel(0)

            detectstop();
        }
    });

    
    var autocheck = null;

    function detectstart() {
        autocheck = setInterval(function(){
            run_check();
            list_check_auto();
        }, 5000);
    };

    function detectstop() {
        clearInterval(autocheck);
    };


    $("#add_form").submit(function (e) {
        e.preventDefault();
    });
    $("#add_form2").submit(function (e) {
        e.preventDefault();
    });

    $("#template-button").click(function () {
        $("#collapseCustom").collapse('hide')
    });

    $("#custom-button").click(function () {
        $("#collapseTemplate").collapse('hide')
    });


    $("#add-row").click(function () {
        var rowCount = $('#urltable tr').length;
        var address = $("#address").val();
        var folder = $("#folder").val();
        var account = $("#account").val();
        var password = $("#password").val();
        var drive = $("#drive").val();
        var markup = "<tr><td>" + rowCount + "</td><td><input type='checkbox' name='record'></td><td>" + address + "</td><td>" + folder + "</td><td>" + account + "</td><td class='psd'>" + password + "</td><td>"
            + drive + "</td><td class='status'><img src='assets/icons/question-circle.svg' role='img' alt='' width='16' height='16' title='Unknown'></td><td class='status'><img src='assets/icons/question-circle.svg' role='img' alt='' width='16' height='16' title='Unknown'></td></tr>";

        if (drive == null) {
            drive = ""
        }

        if ((address.length !== 0) && (folder.length !== 0) && (drive.length !== 0)) {
            $("table tbody").append(markup);
        } else {
            $("#invalidinput").modal('toggle')
        }

        list_drive();
        run_check();
    });

    $("#add-row2").click(function () {
        var rowCount = $('#urltable tr').length;
        var address = $("#srv_template").val();
        var folder = $("#target_template").val();
        var account = $("#account2").val();
        var password = $("#password2").val();
        var drive = $("#drive2").val();
        var markup = "<tr><td>" + rowCount + "</td><td><input type='checkbox' name='record'></td><td>" + address + "</td><td>" + folder + "</td><td>" + account + "</td><td class='psd'>" + password + "</td><td>"
            + drive + "</td><td class='status'><img src='assets/icons/question-circle.svg' role='img' alt='' width='16' height='16' title='Unknown'></td><td class='status'><img src='assets/icons/question-circle.svg' role='img' alt='' width='16' height='16' title='Unknown'></td></tr>";

        if (drive == null) {
            drive = ""
        }

        if ((address.length !== 0) && (folder.length !== 0) && (drive.length !== 0)) {
            $("table tbody").append(markup);
        } else {
            $("#invalidinput").modal('toggle')
        }

        list_drive();
        run_check();
    });

    $(".clear").click(function () {
        $("table tbody tr").remove();
        list_drive();
    });

    // Find and remove selected table rows
    $(".delete-row").click(function () {
        $("table tbody").find('input[name="record"]').each(function () {
            if ($(this).is(":checked")) {
                //remove row
                $(this).parents("tr").remove();
            }
        });

        // Reset the row counts. 
        var i = 0;
        $("tr").find("td:first").each(function (i) {
            // For each TR find the first TD and replace it with the row count
            // We should have a small enough list updating the whole table 
            // shouldn't be an issue instead of only modifying the ones that are after
            $(this).html(i + 1);
        });
        list_drive();
    });


    // Run checks for each row in the html table



    $('#runcheck').click(function (e) {
        run_check();
    });

    function run_check(){
        // For each row run the checks
        $('#urltable > tbody  > tr').each(function () {
            // Get hostname and port
            var domain = $(this).closest('tr').find('td:eq(2)').text();
            $(this).closest('tr').find('td:eq(7)').html(nowChecking);
            // Start the check
            (async () => {
                // use the hostname and port from the table. 
                var cmd = await isPortReachable(445, { host: domain });
                if (cmd == true) {
                    // if port works, send to console
                    console.log(domain + ": SMB port is open.");
                    // and set the staus to success
                    $(this).closest('tr').find('td:eq(7)').html(successState);
                }
                else {
                    // if port is not open, send to console
                    console.log(domain + ": SMB port is closed.");
                    // and set the status to failed
                    $(this).closest('tr').find('td:eq(7)').html(failState);
                }
            })();
        });
    };

    $('#listcheck').click(function (e) {
        e.preventDefault();
        list_check();
        run_check();
    });
    
    function list_check() {

        // For each row run the checks
        $('#urltable > tbody  > tr').each(function () {
            // Get hostname and port
            var address = $(this).closest('tr').find('td:eq(2)').text();
            var folder = $(this).closest('tr').find('td:eq(3)').text();
            var account = $(this).closest('tr').find('td:eq(4)').text();
            var pwd = $(this).closest('tr').find('td:eq(5)').text();
            var drive = $(this).closest('tr').find('td:eq(6)').text();
            $(this).closest('tr').find('td:eq(8)').html(nowChecking);


            Promise.resolve()

                .then(() => {
                    console.log("Testing if \\\\" + address + "\\" + folder + " is already mounted");
                    return networkDrive.find("\\\\" + address + "\\" + folder);
                })
                .then((driveLetters) => {
                    if (0 < driveLetters.length) {
                        console.log("The drive is already mounted. Returning the first drive (" + driveLetters[0] + ") letter because they all point to the same place.");
                        $(this).closest('tr').find('td:eq(8)').html(connected);
                        return driveLetters[0];
                    }
                    else {
                        console.log(address + "\\" + folder + "is not mounted. Mount the path");
                        $(this).closest('tr').find('td:eq(8)').html(disconnected);
                        //return networkDrive.mount("\\\\" + address + "\\" + folder, drive, account, pwd);

                    }
                })
        });
    };

    function list_check_auto() {

        // For each row run the checks
        $('#urltable > tbody  > tr').each(function () {
            // Get hostname and port
            var address = $(this).closest('tr').find('td:eq(2)').text();
            var folder = $(this).closest('tr').find('td:eq(3)').text();
            var account = $(this).closest('tr').find('td:eq(4)').text();
            var pwd = $(this).closest('tr').find('td:eq(5)').text();
            var drive = $(this).closest('tr').find('td:eq(6)').text();
            $(this).closest('tr').find('td:eq(8)').html(nowChecking);


            Promise.resolve()

                .then(() => {
                    console.log("Testing if \\\\" + address + "\\" + folder + " is already mounted");
                    return networkDrive.find("\\\\" + address + "\\" + folder);
                })
                .then((driveLetters) => {
                    if (0 < driveLetters.length) {
                        console.log("The drive is already mounted. Returning the first drive (" + driveLetters[0] + ") letter because they all point to the same place.");
                        $(this).closest('tr').find('td:eq(8)').html(connected);
                        return driveLetters[0];
                    }
                    else {
                        console.log(address + "\\" + folder + "is not mounted. Mount the path");
                        $(this).closest('tr').find('td:eq(8)').html(disconnected);
                        
                        const notification = {
                            title: 'Drive Disconnect',
                            body: address +" "+ folder + ' disconnected',
                            icon: path.join(__dirname, '../app/assets/icons/disconnect.png')
                        }

                        const myNotification = new window.Notification(notification.title, notification)
                        
                    }
                })
        });
    };


    $(".mount").click(function () {
        $("table tbody").find('input[name="record"]').each(function () {
            if ($(this).is(":checked")) {
                var address = $(this).closest('tr').find('td:eq(2)').text();
                var folder = $(this).closest('tr').find('td:eq(3)').text();
                var account = $(this).closest('tr').find('td:eq(4)').text();
                var pwd = $(this).closest('tr').find('td:eq(5)').text();
                var drive = $(this).closest('tr').find('td:eq(6)').text();
                $(this).closest('tr').find('td:eq(8)').html(nowChecking);


                Promise.resolve()

                    .then(() => {
                        console.log("Testing if \\\\" + address + "\\" + folder + " is already mounted");
                        return networkDrive.find("\\\\" + address + "\\" + folder);
                    })
                    .then((driveLetters) => {
                        if (0 < driveLetters.length) {
                            console.log("The drive is already mounted. Returning the first drive (" + driveLetters[0] + ") letter because they all point to the same place.");
                            //$("#alreadymounted").modal('toggle');
                            return driveLetters[0];
                        }
                        else {
                            console.log("The path is not mounted. Mount the path");
                            return networkDrive.mount("\\\\" + address + "\\" + folder, drive, account, pwd);

                        }

                    })
                    .then((driveLetter) => {
                        let filePath;


                        filePath = path.join(driveLetter + ":/");
                        //fs.ensureFileSync(filePath);
                        fs.readdir(filePath, (err) => {
                            if (err) {
                                console.log("There was an error while saving the file. err = " + err.message);
                                throw err
                            };
                            console.log('The file has been saved!');
                            $(this).closest('tr').find('td:eq(8)').html(connected);

                            return;
                        });
                    })
                    .catch((err) => {
                        console.error(err);
                        $(this).closest('tr').find('td:eq(8)').html(failState);
                        return;
                    });
            };
        });
    });

    $('#mount-all').click(function (e) {
        e.preventDefault();

        // For each row run the checks
        $('#urltable > tbody  > tr').each(function () {
            // Get hostname and port
            var address = $(this).closest('tr').find('td:eq(2)').text();
            var folder = $(this).closest('tr').find('td:eq(3)').text();
            var account = $(this).closest('tr').find('td:eq(4)').text();
            var pwd = $(this).closest('tr').find('td:eq(5)').text();
            var drive = $(this).closest('tr').find('td:eq(6)').text();
            $(this).closest('tr').find('td:eq(8)').html(nowChecking);


            Promise.resolve()

                .then(() => {
                    console.log("Testing if \\\\" + address + "\\" + folder + " is already mounted");
                    return networkDrive.find("\\\\" + address + "\\" + folder);
                })
                .then((driveLetters) => {
                    if (0 < driveLetters.length) {
                        console.log("The drive is already mounted. Returning the first drive (" + driveLetters[0] + ") letter because they all point to the same place.");
                        //$("#alreadymounted").modal('toggle');
                        return driveLetters[0];
                    }
                    else {
                        console.log("The path is not mounted. Mount the path");
                        return networkDrive.mount("\\\\" + address + "\\" + folder, drive, account, pwd);

                    }

                })
                .then((driveLetter) => {
                    let filePath;

                    filePath = path.join(driveLetter + ":/");
                    //fs.ensureFileSync(filePath);
                    fs.readdir(filePath, (err) => {
                        if (err) {
                            console.log("Can not Read Network Drive = " + err.message);
                            throw err
                        };
                        console.log('The file has been saved!');
                        $(this).closest('tr').find('td:eq(8)').html(connected);

                        //
                        function mountnoti() {
                            const notification = {
                                title: 'Drive mount',
                                body: 'Drive mount Successfully',
                                icon: path.join(__dirname, '../app/assets/icons/connect.png')
                            }
                            const myNotification = new window.Notification(notification.title, notification)
                        }
                        mountnoti()
                        //윈도우 알림

                        return;
                    });
                })
                .catch((err) => {
                    console.error(err);
                    $(this).closest('tr').find('td:eq(8)').html(failState);
                    $("#error_modal").modal('toggle');

                    return;
                });
        });
    });
    
    $(".unmount").click(function () {
        $("table tbody").find('input[name="record"]').each(function () {
            if ($(this).is(":checked")) {
                var address = $(this).closest('tr').find('td:eq(2)').text();
                var folder = $(this).closest('tr').find('td:eq(3)').text();
                var drive = $(this).closest('tr').find('td:eq(6)').text();

                $(this).closest('tr').find('td:eq(8)').html(nowChecking);

                Promise.resolve()

                    .then(() => {
                        console.log("Testing if \\\\" + address + "\\" + folder + " is already mounted");
                        return networkDrive.find("\\\\" + address + "\\" + folder);
                    })
                    .then((driveLetters) => {
                        if (drive == driveLetters) {
                            console.log("unmounting");
                            //$(this).closest('tr').find('td:eq(8)').html(disconnect);

                            return networkDrive.unmount(drive);
                        }
                        else {
                            console.log("The drive is already unmounted.");
                            $("#error_modal").modal('toggle');
                            $(this).closest('tr').find('td:eq(8)').html(failState);
                            return driveLetters[0];
                        }
                    })
                    .then((driveLetter) => {
                        let filePath;
                        filePath = path.join(driveLetter + ":/");
                        //fs.ensureFileSync(filePath);
                        fs.readdir(filePath, (err) => {
                            if (err) {
                                console.log("Successfully disconnected!= " + err.message);
                                $(this).closest('tr').find('td:eq(8)').html(disconnected);

                                throw err
                            };
                            console.log('Not disconnected...');
                            $(this).closest('tr').find('td:eq(8)').html(unknownState);

                            return;
                        });
                    })
                    .catch((err) => {
                        console.error(err);
                        $(this).closest('tr').find('td:eq(8)').html(unknownState);
                        $("#error_modal").modal('toggle');
                        return;
                    });
            };
        });
    });


    //네트워크 드라이브 올 마운트
    $('#unmount-all').click(function (e) {
        e.preventDefault();


        $('#urltable > tbody  > tr').each(function () {

            var address = $(this).closest('tr').find('td:eq(2)').text();
            var folder = $(this).closest('tr').find('td:eq(3)').text();
            var drive = $(this).closest('tr').find('td:eq(6)').text();

            $(this).closest('tr').find('td:eq(8)').html(nowChecking);

            Promise.resolve()

                .then(() => {
                    console.log("Testing if \\\\" + address + "\\" + folder + " is already mounted");
                    return networkDrive.find("\\\\" + address + "\\" + folder);
                })
                .then((driveLetters) => {
                    if (drive == driveLetters) {
                        console.log("unmounting");
                        //$(this).closest('tr').find('td:eq(8)').html(disconnect);
                        $(this).closest('tr').find('td:eq(8)').html(disconnected);

                        return networkDrive.unmount(drive);
                    }
                    else {
                        console.log("No target.");
                        $("#error_modal").modal('toggle');
                        $(this).closest('tr').find('td:eq(8)').html(failState);
                        return driveLetters[0];
                    }
                })
                .then((driveLetter) => {
                    let filePath;
                    filePath = path.join(driveLetter + ":/");
                    //fs.ensureFileSync(filePath);
                    fs.readdir(filePath, (err) => {
                        if (err) {
                            console.log("Successfully disconnected!= " + err.message);
                            

                            throw err
                        };
                        console.log('Not disconnected...');
                        

                        return;
                    });
                })

                .catch((err) => {
                    console.error(err);
                    $(this).closest('tr').find('td:eq(8)').html(unknownState);
                    return;
                });
        });
    });

    // Open Load URLs modal
    $("#load-urls").click(function (e) {
        e.preventDefault();
        $("#loadurlsModalCenter").modal('toggle');
    });

    //https://stackoverflow.com/questions/12694135/how-to-append-json-array-data-to-html-table-tbody/31810319#31810319
    function jsonToHtmlTable(jsonObj, selector) {
        addColumns(jsonObj, selector);
        addRows(jsonObj, selector);
    }

    function addColumns(jsonObj, selector) {
        if (!$.isArray(jsonObj) || jsonObj.length < 1)
            return;
        var object = jsonObj[0];
        var theadHtml = "";
        for (var property in object) {
            if (object.hasOwnProperty(property))
                theadHtml += "<th>" + property + "</th>";
        }
        $(selector + ' thead tr').html(theadHtml);
    }

    function addRows(jsonObj, selector) {
        var tbody = $(selector + ' tbody');
        $.each(jsonObj, function (i, d) {
            var row = '<tr>';
            $.each(d, function (j, e) {
                row += '<td>' + e + '</td>';
            });
            row += '</tr>';
            tbody.append(row);
        });
    }


    var drivearr = new Array();
    var drivepath = new Array();
    // 현재 드라이브 확인용 전역 배열 선언

    $('.listdrive').click(function (e) {
        e.preventDefault();
        list_drive();
    });

    function list_drive() {
        //e.preventDefault();

        $("form select.drive option").remove();

        var initselect = '<option selected disabled value="">Select.... </option>';

        $("form select.drive").append(initselect);

        networkDrive.list()
            .then(function (drives) {
                drivearr = Object.keys(drives)
                drivepath = Object.values(drives)
                console.log(drivearr);


                //var mountdrive = drivearr[2]

                var drivepool = 'GHIJKLMNOPQRSTUVWXYZ'.split('');

                $('#urltable > tbody > tr').each(function () {
                    var nowdrive = $(this).closest('tr').find('td:eq(6)').text();
                    var willmount = "Scheduled"
                    drivearr.push(nowdrive);
                    drivepath.push(willmount)
                    console.log(drivearr);
                });

                // 현재 프리셋 저장 된 드라이브 리스트 불러오기

                for (var i = 0; i < drivepool.length; i++) {

                    var markup = "<option class=unused>" + drivepool[i] + "</option>";


                    for (var j = 0; j < drivearr.length; j++) {


                        if (drivepool[i] == drivearr[j]) {

                            var used = "<option disabled class=used>" + drivearr[j] + " : " + drivepath[j] + "</option>";
                            $("form select.drive").append(used);

                            break
                        }
                    }

                    if (drivepool[i] !== drivearr[j]) {
                        $("form select.drive").append(markup);
                    }

                }
            });
    };

    //$(".listdrive").trigger("click");



    $("#mountlistnav").click(function (e) {
        e.preventDefault();

        $("div div div div.mounted div").remove();

        networkDrive.list()
            .then(function (drives) {
                var drivearr = Object.keys(drives)
                var drivepath = Object.values(drives)

                for (var j = 0; j < drivearr.length; j++) {
                    var used = "<div class='alert alert-primary' role='alert'>" + drivearr[j] + " : " + drivepath[j] + '</div>'
                    $("div div div div.mounted").append(used);

                    console.log(used)
                }

                $("#mountlist").modal('toggle');
            });
    });

    //select 지정
    var cul_nas = ["cul_m01", "cul_m02", "post_m01"];
    var ent_nas = ["ent_m01", "ent_m02", "ent_m03", "ent_m04", "ent_m05"];
    var dra_nas = ["dra_m01", "dra_m02"];
    var nds_nas = ["nds_m01", "low_m01", "com_m01", "new_catalog_m01", "nds_b01", "low_b01", "new_catalog_b01"]
    var nds_nas_value = ["X", "K", "Z", "W", "Y", "L", "P"]
    var target_teamplate = [["드라이브 선택"], cul_nas, cul_nas, ent_nas, ent_nas, dra_nas, dra_nas, nds_nas, nds_nas, nds_nas];

    function createTag(index) {
        var result = '<option selected disabled value="">Select..</option>';
        target_teamplate[index].forEach(function (item, item_value) {
            if(index = nds_nas) {
                result += '<option value =' + nds_nas_value[item_value] + '>' + item + "</option>";
            }
            else {
                result += "<option>" + item + "</option>";

            }
        });
        return result;
    }

    function chgOptions() {
        var selected_index = $("#srv_template option").index($("#srv_template option:selected"));
        $("#target_template").html(createTag(selected_index));
    }

    $("#srv_template").on("change", function () { chgOptions(); });

    //Json 파일 불러오기
    $("#fileInput").on('change', function () {
        var jsonName = $(this)[0].files[0].name;
        var jsonPath = $(this)[0].files[0].path;

        $("#userfile").val(jsonName);

        console.log(jsonPath)

        $('#loadurls_submit').click(function () {
            // try to load our urls.json file and update our table. 


            try {

                $("table tbody tr").remove();

                var contents = fs.readFileSync(path.join(jsonPath), 'utf8')
                var jsonContent = JSON.parse(contents)


                jsonToHtmlTable(jsonContent, '#urltable');


                // Reset the row counts. 
                var i = 0;
                $("tr").find("td:first").each(function (i) {

                    $(this).html(i + 1);

                });

                $('#urltable > thead  > tr').each(function () {
                    $(this).closest('tr').find('th:eq(5)').css("font-size", "0%")
                });



                // Set the html for the select box, edit attributes, and default status
                $('#urltable > tbody  > tr').each(function () {
                    // Add input box
                    $(this).closest('tr').find('td:eq(1)').html(`<input type="checkbox" name="record"></input>`);
                    $(this).closest('tr').find('td:eq(5)').css("font-size", "0%")

                    // set content editable state
                    //$(this).closest('tr').find('td:eq(2)').addClass("edit").attr("true");;
                    //$(this).closest('tr').find('td:eq(3)').addClass("edit").attr("true");;

                    $(this).closest('tr').find('td:eq(7)').html(unknownState);
                    $(this).closest('tr').find('td:eq(8)').html(unknownState);
                });
                //console.log(data)
            } catch (err) {
                console.error(err)
            }
        });

    });


    $('#defaultJson').click(function () {
        // try to load our urls.json file and update our table. 

        try {

            $("table tbody tr").remove();

            const contents = fs.readFileSync(path.join(__dirname, "default.json"), 'utf8')
            var jsonContent = JSON.parse(contents)


            jsonToHtmlTable(jsonContent, '#urltable');


            // Reset the row counts. 
            var i = 0;
            $("tr").find("td:first").each(function (i) {

                $(this).html(i + 1);

            });

            $('#urltable > thead  > tr').each(function () {
                $(this).closest('tr').find('th:eq(5)').css("font-size", "0%")
            });



            // Set the html for the select box, edit attributes, and default status
            $('#urltable > tbody  > tr').each(function () {
                // Add input box
                $(this).closest('tr').find('td:eq(1)').html(`<input type="checkbox" name="record"></input>`);
                $(this).closest('tr').find('td:eq(5)').css("font-size", "0%")

                // set content editable state
                //$(this).closest('tr').find('td:eq(2)').addClass("edit").attr("true");;
                //$(this).closest('tr').find('td:eq(3)').addClass("edit").attr("true");;

                $(this).closest('tr').find('td:eq(7)').html(unknownState);
                $(this).closest('tr').find('td:eq(8)').html(unknownState);
            });
            //console.log(data)
        } catch (err) {
            console.error(err)
        }
    });

    // Save the table to a JSON file
    $('#convert-table').click(function (e) {

        e.preventDefault();
        // convert table to json
        var table = $('#urltable').tableToJSON();
        // log table to make sure we see if correctly. 
        console.log('Output of current table: ')
        console.log(table);
        // create file 
        var filepath = path.join(__dirname, "default.json");
        // Open file for writing, will always overwrite the current file
        fs.open(filepath, 'w+', function (err, fd) {
            if (err) {
                throw 'error opening file: ' + err;
            }

            // writeFileSync does not return a value, need to be a try/catch
            try {
                fs.writeFileSync(filepath, JSON.stringify(table, null, 2), 'utf-8', (err) => {
                    if (err) throw err
                });
                console.log('The file has been saved to: ' + filepath);
                $('.savefile').html(filepath);
                $("#saveurlsModalCenter").modal('toggle');
            } catch (err) {
                console.log(err);
            }
        });
    });


});
