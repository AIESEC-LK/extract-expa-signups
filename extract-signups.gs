//Access Token
var accessToken = 'YOUR_ACCESS_TOKEN'

// Initialize today's date
var today = new Date();

// Number of milliseconds in 5 days
var numberOfDays = (24 * 60 * 60 * 1000) * 5;

// Subtract 5 days from today's date
today.setTime(today.getTime() - numberOfDays);

// Format today's date in DD/MM/YYYY format for the Sri Lanka time zone
var options = { timeZone: 'Asia/Colombo', day: '2-digit', month: '2-digit', year: 'numeric' };
var formattedToday = today.toLocaleDateString('en-GB', options);

// Define the start date and end date
var startDate = "01/04/2023";
var endDate = "31/01/2024";

// Update the endDate with today's date in DD/MM/YYYY format
endDate = formattedToday;

console.log("Updated endDate:", endDate);


function dataExtraction_Signups(query)
{
  var requestOptions = {
    'method': 'post',
    'payload': query,
    'contentType':'application/json',
    'headers':{
      'access_token': "2f4fdb737c10b7f4e20591bd062ff0d2cbab96355ca0561c24395184d6428668"
    }
  };
  var response = UrlFetchApp.fetch(`https://gis-api.aiesec.org/graphql?access_token=${requestOptions["headers"]["access_token"]}`, requestOptions);
  console.log(response.getContentText())
  var recievedDate = JSON.parse(response.getContentText())["data"]["people"];
  return recievedDate;
}

function signupsLiveUpdating(){
  var today = new Date()
  var numberOfDays = (24*60*60*1000) * 5 //  is the number of days
  var today = today.setTime(today.getTime()-numberOfDays)
  var startDate = "01/04/2023";
  var endDate = "31/01/2024";

// Update the endDate with today's date in DD/MM/YYYY format
  endDate = formattedToday;
  console.log(formattedToday)

  var sheetSUs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Old SignUps")
  var page_number = 1
  var allData = []
  do{
    var querySignups = `query {\n\tpeople(\n\t\tfilters: {\nhome_committee:1623\n registered:{from:\"${startDate}\" to:\"${endDate}\"}, sort: created_at }\n\n\t\tper_page: 1000\n\t\tpage:${page_number}\n\t) {\npaging{\n\t\t\tcurrent_page\n\t\t\ttotal_items\n\t\t\ttotal_pages\n\t\t}\n\t\t\tdata {\n\t\t\tcreated_at\n\t\t\tid\n\t\t\tfull_name\n\tphone\n\t\t\tgender\n\t\t\t\temail\n\t\t\tdob\n\t\t\tstatus\n\t\t\tacademic_experiences {\n\t\t\t\tbackgrounds {\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t\tperson_profile {\n\t\t\t\tselected_programmes\n\t\t\t}\n\t\t\thome_lc {\n\t\t\t\tname\n\t\t\t}\n\t\t\thome_mc {\n\t\t\t\tname\n\t\t\t}\n\n\t\t\tis_aiesecer\n\t\t\treferral_type\n\tlc_alignment{\n\t\t\t\tkeywords\n\t\t\t\t\n\t\t\t}\t\tlatest_graduation_date\n\topportunity_applications_count\n\t\t}\n\t}\n}\n`
    var query = JSON.stringify({query: querySignups}) 
    var data = dataExtraction_Signups(query)
    if(data != null)
    {
      if(data.length != 0){
        allData.push(data.data)
        page_number++
      }
    }
    else{
      break
    }
    Logger.log(data.length)
  }while(data.paging.current_page <= data.paging.total_pages);

  var newRows = []
  var ids = sheetSUs.getRange(1,1,sheetSUs.getLastRow(),1).getValues()
  ids = ids.flat(1)
  for(let data of allData){  
    for(let i = 1; i < data.length; i++){
      Logger.log(i)
      
      if(ids.indexOf(parseInt(data[i].id))<0)
      {
        var backgrounds = []
        if(data[i].academic_experiences[0] != null){
          if(data[i].academic_experiences[0].backgrounds[0] != null)
          {
            backgrounds.push(data[i].academic_experiences[0].backgrounds[0].name)
          }
        }
        newRows.push([
            data[i].id,
            data[i].created_at.substring(0,10),
            data[i].full_name,
            data[i].phone,
            data[i].gender,
            data[i].email,
            data[i].dob,  
            data[i].status,
            data[i].person_profile? changeProductCode(data[i].person_profile.selected_programmes):"-",
            backgrounds.join(","),
            data[i].home_lc.name,
            data[i].home_mc.name,
            data[i].lc_alignment ? data[i].lc_alignment.keywords:"-",
            data[i].is_aiesecer==false?"No":"Yes",
            data[i].referral_type,
            data[i].opportunity_applications_count,
            data[i].latest_graduation_date?data[i].latest_graduation_date.substring(0,10):"-",
          ])
      }
      else{
        var row = []

        row.push([
            data[i].id,
            data[i].created_at.substring(0,10),
            data[i].full_name,
            data[i].phone,
            data[i].gender,
            data[i].email,
            data[i].dob,  
            data[i].status,
            data[i].person_profile? changeProductCode(data[i].person_profile.selected_programmes):"-",
            data[i].backgrounds,
            data[i].home_lc.name,
            data[i].home_mc.name,
            data[i].lc_alignment ? data[i].lc_alignment.keywords:"-",
            data[i].is_aiesecer==false?"No":"Yes",
            data[i].referral_type,
            data[i].opportunity_applications_count,
            data[i].latest_graduation_date?data[i].latest_graduation_date.substring(0,10):"-",
          ])
          sheetSUs.getRange(ids.indexOf(parseInt(data[i].id))+1,1,1,row[0].length).setValues(row)
      } 
    }
  }
  if(newRows.length > 0){
    sheetSUs.getRange(sheetSUs.getLastRow()+1,1,newRows.length,newRows[0].length).setValues(newRows)
  }
  
}


function changeProductCode(num) {
  var product = ""
  if (num == "7") 
    product = "GV New"
  else if (num == "8") 
    product = "GTa"
  else if (num == "9") 
    product = "GTe";
  else if (num == "1") 
    product = "GV Old";
  else if (num == "2") 
    product = "GT";
  else if (num == "5")
    product = "GE";
  
  return product
}