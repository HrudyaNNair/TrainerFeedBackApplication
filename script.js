// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDwWHsh_WJYgtUwR_BYvyMhZyW6srMWmCM",
  authDomain: "feedback-system-7877f.firebaseapp.com",
  databaseURL: "https://feedback-system-7877f-default-rtdb.firebaseio.com",
  projectId: "feedback-system-7877f",
  storageBucket: "feedback-system-7877f.appspot.com",
  messagingSenderId: "839552435361",
  appId: "1:839552435361:web:209d5f30fe8bc455155ce0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();


// Add default questions (only run once)
function addDefaultQuestions() {
  const questions = {
    common: {
      1: "The trainer provided me adequate opportunity to ask questions/clarify the concepts",
      2: "Included an appropriate number of activities, exercise, and interaction during the session",
      3: "The trainer is a subject matter expert and is approachable",
      4: "The trainer encouraged participation and enthusiasm throughout the class",
      5: "What went well / things you most liked about the program (Comments by trainees)",
      6: "What needs improvement / things you less liked about the program (Comments by trainees)"
    },
    singleTrainerOnly: {
      7: "Overall Program Rating — Out of 5"
    }
  };

  db.ref("questions").set(questions)
    .then(() => console.log("✅ Default questions added"))
    .catch((error) => console.error("❌ Error: ", error));
}

const backBtn = document.getElementById("backBtn");
backBtn.disabled= true;
const errorMsg = document.getElementById('errorMsg');

 
document.getElementById("uploadBtn").addEventListener("click", handleFileUpload);
backBtn.disabled= false;
let trainers = [];


 

function handleFileUpload() {
    const input = document.getElementById("fileInput");
    const file = input.files[0];
     errorMsg.style.display = "block";

    if (!file) {
        // I've replaced the alert with a message box for a better UX.
        showMessageBox("Please upload a file first.");
        errorMsg.textContent = "⚠️ Please upload the file";
        return;
    }
     else {
    errorMsg.textContent = ""; 
  }

    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const responses = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

        if (responses.length === 0) {
            showMessageBox("Empty sheet!");
            return;
        }

        const headerRow = Object.keys(responses[0]).map(h => String(h).trim());

         
        document.getElementById("uploadBtn").style.display = "none";
        document.getElementById("fileInput").style.display = "none";
        document.getElementById("reportHeader").style.display="block";
        //  Case 1: Single Trainer
        if (headerRow.some(h => h.toLowerCase().includes("overall program rating"))) {
            
            showMessageBox("This is a Single Trainer sheet.");

            document.getElementById("singleTrainerDiv").style.display = "block";
            document.getElementById("trainerDropdownField").style.display = "none";

            document.getElementById("generateBtn").style.display = "block";
            document.getElementById("generateBtnMulti").style.display = "none";

            document.getElementById("generateBtn").onclick = () => {
                const trainerName = document.getElementById("trainerName").value.trim();
                const batchName  = document.getElementById("batch").value.trim();
                const reportName = document.getElementById("reportName").value.trim();
                if (!batchName || !reportName || !trainerName) {
                    //alert("Please fill in all fields before generating the report!");
                     errorMsg.textContent = "⚠️ Please fill in all fields before generating the report.";
                    return;
                }
                 
                errorMsg.textContent = ""; 
                console.log(responses);
                generateReport(responses, true, trainerName,batchName,reportName);
                
            };
        }
        // Case 2: Multi Trainer
        else {
             
            showMessageBox("This is a Multi Trainer sheet.");

            
            document.getElementById("singleTrainerDiv").style.display = "none";
            document.getElementById("trainerDropdownField").style.display = "block";

            // Extract trainer names from headers ending with numbers
            let trainerNamesSet = new Set();
            headerRow.forEach(h => {
                const match = h.match(/^(.*?)(\d+)$/); // matches any name ending with number
                if (match) {
                    const baseName = match[1].trim();
                    if (baseName) trainerNamesSet.add(baseName);
                }
            });


            const trainers = Array.from(trainerNamesSet);

            
            // populate dropdown
            const dropdown = document.getElementById("trainerDropdown");
            dropdown.innerHTML = "";

            const placeholder = document.createElement("option");
            placeholder.value = "";
            placeholder.textContent = "Select Trainer";
            placeholder.disabled = true;
            placeholder.selected = true;
            dropdown.appendChild(placeholder);

            trainers.forEach(name => {
                const option = document.createElement("option");
                option.value = name;
                option.textContent = name;
                dropdown.appendChild(option);
            });
 
            document.getElementById("generateBtn").style.display = "none";
            document.getElementById("generateBtnMulti").style.display = "block";

           
            // const batchName  = document.getElementById("batch").value.trim();
            // const reportName = document.getElementById("reportName").value.trim();
            document.getElementById("generateBtnMulti").onclick = () => {
            const batchName  = document.getElementById("batch").value.trim();
            const reportName = document.getElementById("reportName").value.trim();
                const selectedTrainer = dropdown.value;
                if (!selectedTrainer||!batchName || !reportName ) {
                     //alert("Please fill in all fields before generating the report!");
                      errorMsg.textContent = '⚠️ Please fill in all fields before generating the report.';
                    return;
                }
                // else{
                errorMsg.textContent = ""; 
                // console.log(responses);
                 
                // generateReport(responses, false, selectedTrainer,batchName,reportName);
                // }
                console.log(responses);
                 
                generateReport(responses, false, selectedTrainer,batchName,reportName);
            };
              
        }
    };

    reader.readAsArrayBuffer(file);
}

 
function showMessageBox(message) {
     
    console.log("Message Box:", message);
}

 


// function saveToFirebase(trainer, rows, hasQuestions) {
//   if (hasQuestions) {
//     // ✅ Only store responses (not headers)
//     db.ref("feedback").child(trainer).set({ responses: rows });
//   } else {
//     // ✅ Multi-trainer → attach default questions
//     db.ref("questions").once("value").then(snapshot => {
//       const questions = snapshot.val();
//       db.ref("feedback").child(trainer).set({
//         questions: questions,
//         responses: rows
//       });
//     });
//   }
//   console.log("✅ Data saved to Firebase");
// }


// ✅ Fetch default questions
async function getStoredQuestions() {
  const snapshot = await db.ref("feedback/questions").once("value");
  return snapshot.val() || [];
}

/**
 * Asynchronously generates a PDF report from survey responses.
 * @param {Array<Object>} responses The array of response objects.
 * @param {boolean} isSingleTrainer True if generating a single-trainer report.
 * @param {string} trainerName The name of the trainer.
 */
async function generateReport(responses, isSingleTrainer = false, trainerName = "" , batchName="",reportName="") {
    
    backBtn.style.display = 'none';
  
     
    generateBtn.textContent = 'Generating';
    generateBtnMulti.textContent = 'Generating';
    generateBtn.disabled = true;
    generateBtnMulti.disabled =true;
    document.querySelectorAll('input, select, textarea')
            .forEach(el => el.disabled = true);
     

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 20;
        const margin = 10;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Helper function to normalize keys by removing whitespace and converting to lowercase
        const normalizeKey = (key) => {
            if (typeof key !== 'string') return '';
            return key.replace(/\s+/g, ' ').trim().toLowerCase();
        };

        // Define a mapping from ratings to numerical values for weighted average calculation
        const ratingValuesMap = {
            "Excellent": 5,
            "Very Good": 4,
            "Very good": 4,
            "Good": 3,
            "Average": 2,
            "Poor": 1
        };

        // Fetch questions from Firebase
        let questions;
        try {
            const questionsRef = firebase.database().ref('questions');
            const snapshot = await questionsRef.once('value');
            questions = snapshot.val();
            
            if (!questions) {
                throw new Error('Questions not found in database');
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            // Fallback to hardcoded questions if Firebase fails
            questions = {
                common: {
                    1: "The trainer provided me adequate opportunity to ask questions/clarify the concepts",
                    2: "Included an appropriate number of activities, exercise, and interaction during the session",
                    3: "The trainer is a subject matter expert and is approachable",
                    4: "The trainer encouraged participation and enthusiasm throughout the class",
                    5: "What went well / things you most liked about the program (Comments by trainees)",
                    6: "What needs improvement / things you less liked about the program (Comments by trainees)"
                },
                singleTrainerOnly: {
                    7: "Overall Program Rating — Out of 5"
                }
            };
        }

        // Determine which set of responses to use based on the isSingleTrainer flag
        let responsesToProcess = responses;
        if (!isSingleTrainer) {
            responsesToProcess = responses.filter(r => r[trainerName] || r[`${trainerName}2`] || r[`${trainerName}3`] || r[`${trainerName}4`]);
        }

        // Calculate overall rating
        const totalResponses = responsesToProcess.length;
        let overallRating;

        if (isSingleTrainer) {
            const overallRatingKey = questions.singleTrainerOnly[7];
            const possibleOverallKeys = [
                "Overall program rating",
                overallRatingKey,
                "Overall Program Rating",
                "Overall Program Rating — Out of 5"
            ].map(normalizeKey);
            
            let overallSum = 0;
            let overallCount = 0;
            responsesToProcess.forEach(r => {
                const normalizedResponseKeys = Object.keys(r).map(normalizeKey);
                for (const key of possibleOverallKeys) {
                    const keyIndex = normalizedResponseKeys.indexOf(key);
                    if (keyIndex !== -1) {
                        const originalKey = Object.keys(r)[keyIndex];
                        overallSum += Number(r[originalKey]) || 0;
                        overallCount++;
                        break;
                    }
                }
            });
            overallRating = overallCount > 0 ? overallSum / overallCount : 0;
        } else {
            let totalWeightedRating = 0;
            const quantitativeQuestionKeys = [trainerName, `${trainerName}2`, `${trainerName}3`, `${trainerName}4`];
            responsesToProcess.forEach(response => {
                let traineeTotalRating = 0;
                let questionCount = 0;
                quantitativeQuestionKeys.forEach(key => {
                    const rating = response[key];
                    if (rating && ratingValuesMap.hasOwnProperty(rating)) {
                        traineeTotalRating += ratingValuesMap[rating];
                        questionCount++;
                    }
                });
                if (questionCount > 0) {
                    totalWeightedRating += traineeTotalRating / questionCount;
                }
            });
            overallRating = totalResponses > 0 ? totalWeightedRating / totalResponses : 0;
        }

        // --- HEADER SECTION ---
        doc.setFillColor(70, 130, 180);
        doc.rect(margin, y - 5, pageWidth - (2 * margin), 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`ILP -  ${reportName} Feedback—${trainerName}`, margin + 2, y + 2);
        y += 15;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        
        const headers = ["Batch Name", "Total Trainee Count", "Trainer Name", "Overall Program Rating\nOut of 5"];
        const values = [`ILP ${batchName} Batch`, totalResponses.toString(), trainerName, overallRating.toFixed(2)];
        
        const colWidth = (pageWidth - 2 * margin) / headers.length;
        const summaryTableStartX = margin;
        const headerHeight = 15;
        const valueHeight = 8;
        
        headers.forEach((header, i) => {
            const x = summaryTableStartX + (i * colWidth);
            doc.rect(x, y, colWidth, headerHeight);
            const headerLines = doc.splitTextToSize(header, colWidth - 4);
            doc.text(headerLines, x + (colWidth / 2), y + headerHeight / 2, { align: "center", baseline: "middle" });
        });
        y += headerHeight;
        
        doc.setFont("helvetica", "normal");
        values.forEach((value, i) => {
            const x = summaryTableStartX + (i * colWidth);
            doc.rect(x, y, colWidth, valueHeight);
            doc.text(value, x + (colWidth / 2), y + 5, { align: "center", baseline: "middle" });
        });
        y += valueHeight + 10;

        // --- RATING BREAKDOWN SECTION ---
        let quantitativeQuestions;
        
        if (isSingleTrainer) {
             const rawQuestions = [{
                question: questions.common[1],
                keys: [
                    "The trainer provided me adequate opportunity to ask questions/clarify the concepts",
                    "The trainer provided me adequate opportunity to ask questions/clarify the concepts\u00a0"
                ],
            }, {
                question: questions.common[2],
                keys: [
                    "Included an appropriate number of activities, exercise, and interaction during the session",
                    "Included an appropriate number of activities, exercise, and interaction\u00a0during the session"
                ],
            }, {
                question: questions.common[3],
                keys: [
                    "The trainer is a Subject Matter Expert and approachable ",
                    "The trainer is a subject matter expert and is approachable",
                    "The trainer is a subject matter expert and is approachable\u00a0",
                    "The trainer is a subject matter expert and is approachable\n"
                ],
            }, {
                question: questions.common[4],
                keys: [
                    "The trainer encouraged participation and enthusiasm throughout the class ",
                    "The trainer encouraged participation and enthusiasm throughout the class",
                    "The trainer encouraged participation and enthusiasm throughout the class\u00a0"
                ],
            }];
            console.log(rawQuestions);
            quantitativeQuestions = rawQuestions.filter(q => {
    // Include question only if at least one response has any of its keys
    return responsesToProcess.some(r =>
        q.keys.some(k => {
            const normalizedKey = normalizeKey(k);
            return Object.keys(r).some(header =>
                normalizeKey(header) === normalizedKey && ratingValuesMap.hasOwnProperty(r[header])
            );
        })
    );
});

console.log("Questions included in PDF:", quantitativeQuestions);
        console.log(quantitativeQuestions);
           // quantitativeQuestions = rawQuestions 
           
           
              console.log(quantitativeQuestions);
        } else {
        const rawQuestions = [{
        question: questions.common[1],
        keys: [trainerName],
    }, {
        question: questions.common[2],
        keys: [`${trainerName}2`],
    }, {
        question: questions.common[3],
        keys: [`${trainerName}3`],
    }, {
        question: questions.common[4],
        keys: [`${trainerName}4`],
    }];
    quantitativeQuestions = rawQuestions.filter(q => {
        return responsesToProcess.some(r =>
            q.keys.some(k => r[k] && ratingValuesMap.hasOwnProperty(r[k]))
        );
    });
        }

        const ratingValues = ["Excellent", "Very Good", "Good", "Average", "Poor"];
        
        const getRatingCounts = (questionKeys) => {
            const counts = {};
            ratingValues.forEach(value => counts[value] = 0);
            const normalizedQuestionKeys = questionKeys.map(normalizeKey);
            
            responsesToProcess.forEach(response => {
                let rating = null;
                
                for (const key of Object.keys(response)) {
                    if (normalizedQuestionKeys.includes(normalizeKey(key))) {
                        rating = response[key];
                        break;
                    }
                }

                if (rating) {
                    const normalizedRating = rating.replace("Very good", "Very Good");
                    if (counts.hasOwnProperty(normalizedRating)) {
                        counts[normalizedRating]++;
                    }
                }
            });
            return counts;
        };

        const allQuestionCounts = quantitativeQuestions.map(q => getRatingCounts(q.keys));
        
        const tableStartX = margin;
        const ratingColWidth = 38;
        const questionColWidth = (pageWidth - 2 * margin - ratingColWidth) / quantitativeQuestions.length;
        const totalTableWidth = ratingColWidth + (questionColWidth * quantitativeQuestions.length);
        
        const headerRowHeight = 24;
        const dataRowHeight = 12;
        const numDataRows = ratingValues.length + 1;
        const totalTableHeight = headerRowHeight + (dataRowHeight * numDataRows);
        
        doc.setLineWidth(0.5);
        doc.rect(tableStartX, y, totalTableWidth, totalTableHeight);
        doc.line(tableStartX + ratingColWidth, y, tableStartX + ratingColWidth, y + totalTableHeight);
        for (let i = 1; i <= quantitativeQuestions.length; i++) {
            const x = tableStartX + ratingColWidth + (i * questionColWidth);
            doc.line(x, y, x, y + totalTableHeight);
        }
        
        doc.line(tableStartX, y + headerRowHeight, tableStartX + totalTableWidth, y + headerRowHeight);
        for (let i = 0; i <= numDataRows; i++) {
            doc.line(tableStartX, y + headerRowHeight + (i * dataRowHeight), tableStartX + totalTableWidth, y + headerRowHeight + (i * dataRowHeight));
        }
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        let currentX = tableStartX + ratingColWidth;
        quantitativeQuestions.forEach((q) => {
            const questionLines = doc.splitTextToSize(q.question, questionColWidth - 4);
            doc.text(questionLines, currentX + questionColWidth / 2, y + headerRowHeight / 2, { align: "center", baseline: "middle" });
            currentX += questionColWidth;
        });
        
        doc.setFont("helvetica", "normal");
        ratingValues.forEach((rating, rowIndex) => {
            currentX = tableStartX;
            let rowY = y + headerRowHeight + (rowIndex * dataRowHeight);
            
            doc.text(rating, currentX + ratingColWidth / 2, rowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
            currentX += ratingColWidth;
            
            allQuestionCounts.forEach((counts) => {
                const count = counts[rating];
                doc.text(count.toString(), currentX + questionColWidth / 2, rowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
                currentX += questionColWidth;
            });
        });
        
        doc.setFont("helvetica", "bold");
        let totalRowY = y + headerRowHeight + (ratingValues.length * dataRowHeight);
        doc.text("Total responded\ntrainees", tableStartX + ratingColWidth / 2, totalRowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
        
        currentX = tableStartX + ratingColWidth;
        for (let i = 0; i < quantitativeQuestions.length; i++) {
            doc.text(totalResponses.toString(), currentX + questionColWidth / 2, totalRowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
            currentX += questionColWidth;
        }
        
        y += totalTableHeight + 15;

        // --- QUALITATIVE FEEDBACK SECTION ---
        const filterComments = (comments) => {
            const genericWords = ['nil', 'none', 'nothing', 'nothing specific', 'no comment', 'n/a', ''];
            const uniqueComments = [...new Set(comments.map(c => c.toLowerCase().trim()))];
            return uniqueComments.filter(c => !genericWords.includes(c));
        };

        const summarizeComments = async (comments) => {
            if (comments.length === 0) {
                return "No significant comments to summarize.";
            }
            
            const apiKey = "AIzaSyC0GzgTH1rtB9EwARB8H98sZYB6AlBhAZs"; // API key is provided by the canvas environment
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
            
            const prompt = `Based on the following feedback comments from a training session, provide a concise summary of the key themes. Focus on the main points and overall sentiment.
            
            Comments:
            ${comments.join('\n- ')}
            
            Summary:`;

            let retries = 3;
            while (retries > 0) {
                try {
                    const payload = {
                        contents: [{ parts: [{ text: prompt }] }],
                        systemInstruction: { parts: [{ text: "You are a helpful assistant that summarizes feedback from trainees. Provide a single paragraph summary." }] },
                    };
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`API call failed with status ${response.status}: ${errorText}`);
                    }
                    
                    const result = await response.json();
                    const summary = result?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (summary) {
                        return summary;
                    } else {
                        throw new Error('API response was not in the expected format.');
                    }
                } catch (error) {
                    console.error('Error summarizing comments:', error);
                    retries--;
                    if (retries > 0) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
            return "Unable to generate a summary at this time. Please see raw comments for details.";
        };

        const whatWentWell = responsesToProcess.map(r => 
            r[questions.common[5]] || 
            r["What went well / things you most liked about the program "] ||
            r["What went well / things you most liked about the program\u00a0"]
        ).filter(c => c && c.trim()).flat();
        
        const whatNeedsImprovement = responsesToProcess.map(r => 
            r[questions.common[6]] || 
            r["What needs improvement / things you less liked about the program "] ||
            r["What needs improvement / things you less liked about the program\u00a0"]
        ).filter(c => c && c.trim()).flat();
        
        const filteredWentWell = filterComments(whatWentWell);
        const filteredNeedsImprovement = filterComments(whatNeedsImprovement);
        
        const wentWellSummary = await summarizeComments(filteredWentWell);
        const needsImprovementSummary = await summarizeComments(filteredNeedsImprovement);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const wentWellTextLines = doc.splitTextToSize(wentWellSummary, pageWidth - (2 * margin));
        const wentWellSectionHeight = 12 + (wentWellTextLines.length * 4) + 5;
        
        if (y + wentWellSectionHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }

        doc.setFillColor(34, 139, 34);
        doc.rect(margin, y - 3, pageWidth - (2 * margin), 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("What went well / things you most liked about the program (Summary)", margin + 2, y + 3);
        y += 12;
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(wentWellTextLines, margin, y);
        y += (wentWellTextLines.length * 4) + 5;

        const needsImprovementTextLines = doc.splitTextToSize(needsImprovementSummary, pageWidth - (2 * margin));
        const needsImprovementSectionHeight = 12 + (needsImprovementTextLines.length * 4) + 5;
        
        if (y + needsImprovementSectionHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
        
        doc.setFillColor(220, 20, 60);
        doc.rect(margin, y - 3, pageWidth - (2 * margin), 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("What needs improvement / things you less liked about the program (Summary)", margin + 2, y + 3);
        y += 12;
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(needsImprovementTextLines, margin, y);
        y += (needsImprovementTextLines.length * 4) + 5;
        
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        const parentDiv = document.getElementById('container');
        if (!parentDiv) return console.error("Parent div not found.");

        let previewContainer = document.getElementById('pdfPreviewContainer');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'pdfPreviewContainer';
            previewContainer.style.cssText = `
                width: 100%;
                max-width: 800px;
                margin: 20px auto;
                padding: 15px;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                background: #fff;
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                text-align: center;
            `;
            parentDiv.insertAdjacentElement('afterend', previewContainer);
        }

        previewContainer.innerHTML = '';
        let iframe = document.createElement('iframe');
        iframe.id = 'pdfIframe';
        iframe.style.cssText = 'width:100%; height:800px; border:none;';
        iframe.src = pdfUrl;
        previewContainer.appendChild(iframe);
      

        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download PDF';
        downloadBtn.className = 'secondary-btn';
        downloadBtn.style.marginTop = '15px';
        downloadBtn.onclick = () => {
            doc.save(trainerName ? `${trainerName}_feedback.pdf` : "feedback_report.pdf");
            previewContainer.remove();
            URL.revokeObjectURL(pdfUrl);
            // backBtn.style.display = 'block';
            // generateBtn.disabled = false;
             backBtn.style.display = 'block';
            backBtn.disabled = false;

    
        };
        previewContainer.appendChild(downloadBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel Preview';
        cancelBtn.className = 'secondary-btn';
        cancelBtn.style.marginTop = '15px';
        cancelBtn.style.marginLeft = '2px';
        cancelBtn.onclick = () => {
            previewContainer.remove();
            URL.revokeObjectURL(pdfUrl);
            backBtn.style.display = 'block';
            backBtn.disabled = false;

            // generateBtn.disabled = false;
        };
        previewContainer.appendChild(cancelBtn);

    } catch (error) {
        console.error("An error occurred during report generation:", error);
        // You could also add code here to show a user-friendly error message on the page
    } finally {
         
        generateBtn.textContent = 'Generate';
        generateBtn.disabled = false;
        generateBtnMulti.textContent = 'Generate';
        generateBtnMulti.disabled = false;
        document.querySelectorAll('input, select, textarea').forEach(el => el.disabled = false);
        // backBtn.style.display = 'block';
        // backBtn.disabled = false;
               
        //}
    }
}

const uploadBtn = document.getElementById("uploadBtn");

// Upload -> hide upload section, show generate + back
uploadBtn.addEventListener("click", () => {
    singleTrainerDiv.style.display = "none";
    trainerDropdownField.style.display = "none";

    uploadSection.style.display = "none";   //  hide upload screen
    generateBtn.style.display = "inline-block"; 
    backBtn.style.display = "inline-block"; //  always show back when generate is visible
});

 


 
backBtn.addEventListener("click", () => {
    if (pdfPreviewContainer.style.display === "block") {
       
        pdfPreviewContainer.style.display = "none";
    }
    singleTrainerDiv.style.display = "none";
    trainerDropdownField.style.display = "none";
    reportHeader.style.display = "none";
    errorMsg.style.display = "none";
    uploadSection.style.display = "inline-block"; //  show upload section again
    generateBtn.style.display = "none";           //  hide generate
    backBtn.style.display = "none";               //  hide back at upload step

    // reset file input
    const fileInput = document.getElementById("fileInput");
    fileInput.value = "";
    fileInput.style.display = "block";  

    document.getElementById("uploadBtn").style.display = "inline-block";

    console.log("Back clicked");
});

 
const generateBtn = document.getElementById("generateBtn");
const pdfPreviewContainer = document.getElementById("pdfPreviewContainer");
 

 

const logoutBtn = document.getElementById('logoutBtn');

  // Add click event
  logoutBtn.addEventListener('click', () => {
    // Redirect to login.html
    window.location.href = 'login.html';
  });

 

 



// async function generateReport(responses, isSingleTrainer = false, trainerName = "") {
//     const { jsPDF } = window.jspdf;
//     const doc = new jsPDF();
//     let y = 20;
//     const margin = 10;
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const pageHeight = doc.internal.pageSize.getHeight();

//     // Helper function to normalize keys by removing whitespace and converting to lowercase
//     const normalizeKey = (key) => {
//         if (typeof key !== 'string') return '';
//         return key.replace(/\s+/g, ' ').trim().toLowerCase();
//     };

//     // Define a mapping from ratings to numerical values for weighted average calculation
//     const ratingValuesMap = {
//         "Excellent": 5,
//         "Very Good": 4,
//         "Very good": 4, // Handles both capitalizations
//         "Good": 3,
//         "Average": 2,
//         "Poor": 1
//     };

//     // Show loading message
// document.getElementById('loadingMessage').style.display = 'none';

// // Hide loading message
// document.getElementById('loadingMessage').style.display = 'block';

//     // Show a loading message while the report is being generated
//     // const loadingMessage = document.createElement('div');
//     // loadingMessage.textContent = 'Generating report... Please wait.';
//     // loadingMessage.style.cssText = `
//     //     position: fixed;
//     //     top: 50%;
//     //     left: 50%;
//     //     transform: translate(-50%, -50%);
//     //     background-color: #f3f4f6;
//     //     padding: 20px 40px;
//     //     border-radius: 8px;
//     //     box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//     //     z-index: 1000;
//     //     font-family: 'Inter', sans-serif;
//     // `;
//     // document.body.appendChild(loadingMessage);

//     // Fetch questions from Firebase
//     let questions;
//     try {
//         const questionsRef = firebase.database().ref('questions');
//         const snapshot = await questionsRef.once('value');
//         questions = snapshot.val();
        
//         if (!questions) {
//             throw new Error('Questions not found in database');
//         }
//     } catch (error) {
//         console.error('Error fetching questions:', error);
//         // Fallback to hardcoded questions if Firebase fails
//         questions = {
//             common: {
//                 1: "The trainer provided me adequate opportunity to ask questions/clarify the concepts",
//                 2: "Included an appropriate number of activities, exercise, and interaction during the session",
//                 3: "The trainer is a subject matter expert and is approachable",
//                 4: "The trainer encouraged participation and enthusiasm throughout the class",
//                 5: "What went well / things you most liked about the program (Comments by trainees)",
//                 6: "What needs improvement / things you less liked about the program (Comments by trainees)"
//             },
//             singleTrainerOnly: {
//                 7: "Overall Program Rating — Out of 5"
//             }
//         };
//     }

//     // Determine which set of responses to use based on the isSingleTrainer flag
//     let responsesToProcess = responses;
//     if (!isSingleTrainer) {
//         responsesToProcess = responses.filter(r => r[trainerName] || r[`${trainerName}2`] || r[`${trainerName}3`] || r[`${trainerName}4`]);
//     }

//     // Calculate overall rating
//     const totalResponses = responsesToProcess.length;
//     let overallRating;

//     if (isSingleTrainer) {
//         const overallRatingKey = questions.singleTrainerOnly[7];
//         // Try multiple possible keys for overall rating
//         const possibleOverallKeys = [
//             "Overall program rating", // Exact key from your data
//             overallRatingKey, // Firebase version
//             "Overall Program Rating",
//             "Overall Program Rating — Out of 5"
//         ].map(normalizeKey);
        
//         let overallSum = 0;
//         let overallCount = 0;
//         responsesToProcess.forEach(r => {
//             const normalizedResponseKeys = Object.keys(r).map(normalizeKey);
//             for (const key of possibleOverallKeys) {
//                 const keyIndex = normalizedResponseKeys.indexOf(key);
//                 if (keyIndex !== -1) {
//                     const originalKey = Object.keys(r)[keyIndex];
//                     overallSum += Number(r[originalKey]) || 0;
//                     overallCount++;
//                     break; // Found a match, stop looking
//                 }
//             }
//         });
//         overallRating = overallCount > 0 ? overallSum / overallCount : 0;
//     } else {
//         let totalWeightedRating = 0;
//         const quantitativeQuestionKeys = [trainerName, `${trainerName}2`, `${trainerName}3`, `${trainerName}4`];
//         responsesToProcess.forEach(response => {
//             let traineeTotalRating = 0;
//             let questionCount = 0;
//             quantitativeQuestionKeys.forEach(key => {
//                 const rating = response[key];
//                 if (rating && ratingValuesMap.hasOwnProperty(rating)) {
//                     traineeTotalRating += ratingValuesMap[rating];
//                     questionCount++;
//                 }
//             });
//             if (questionCount > 0) {
//                 totalWeightedRating += traineeTotalRating / questionCount;
//             }
//         });
//         overallRating = totalResponses > 0 ? totalWeightedRating / totalResponses : 0;
//     }

//     // --- HEADER SECTION ---
//     // Title with colored background
//     doc.setFillColor(70, 130, 180); // Steel blue color
//     doc.rect(margin, y - 5, pageWidth - (2 * margin), 12, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(14);
//     doc.setFont("helvetica", "bold");
//     doc.text(`ILP - Tech Fundamentals Feedback—${trainerName}`, margin + 2, y + 2);
//     y += 15;

//     // Reset text color
//     doc.setTextColor(0, 0, 0);

//     // Summary info table
//     doc.setFontSize(10);
//     doc.setFont("helvetica", "bold");
    
//     const headers = ["Batch Name", "Total Trainee Count", "Trainer Name", "Overall Program Rating\nOut of 5"];
//     const values = ["ILP 2024-25 Batch", totalResponses.toString(), trainerName, overallRating.toFixed(2)];
    
//     const colWidth = (pageWidth - 2 * margin) / headers.length;
//     const summaryTableStartX = margin;
//     const headerHeight = 15; // Increased height for wrapping
//     const valueHeight = 8;
    
//     // Header row
//     headers.forEach((header, i) => {
//         const x = summaryTableStartX + (i * colWidth);
//         doc.rect(x, y, colWidth, headerHeight);
//         const headerLines = doc.splitTextToSize(header, colWidth - 4);
//         doc.text(headerLines, x + (colWidth / 2), y + headerHeight / 2, { align: "center", baseline: "middle" });
//     });
//     y += headerHeight;
    
//     // Value row
//     doc.setFont("helvetica", "normal");
//     values.forEach((value, i) => {
//         const x = summaryTableStartX + (i * colWidth);
//         doc.rect(x, y, colWidth, valueHeight);
//         doc.text(value, x + (colWidth / 2), y + 5, { align: "center", baseline: "middle" });
//     });
//     y += valueHeight + 10;

//     // --- RATING BREAKDOWN SECTION ---
//     let quantitativeQuestions;
    
//     if (isSingleTrainer) {
//         // Fallback to explicit keys for robustness with data inconsistencies
//         quantitativeQuestions = [{
//             question: questions.common[1],
//             keys: [
//                 "The trainer provided me adequate opportunity to ask questions/clarify the concepts",
//                 "The trainer provided me adequate opportunity to ask questions/clarify the concepts\u00a0"
//             ],
//         }, {
//             question: questions.common[2],
//             keys: [
//                 "Included an appropriate number of activities, exercise, and interaction during the session",
//                 "Included an appropriate number of activities, exercise, and interaction\u00a0during the session"
//             ],
//         }, {
//             question: questions.common[3],
//             keys: [
//                 "The trainer is a Subject Matter Expert and approachable ",
//                 "The trainer is a subject matter expert and is approachable",
//                 "The trainer is a subject matter expert and is approachable\u00a0",
//                 "The trainer is a subject matter expert and is approachable\n"
//             ],
//         }, {
//             question: questions.common[4],
//             keys: [
//                 "The trainer encouraged participation and enthusiasm throughout the class ",
//                 "The trainer encouraged participation and enthusiasm throughout the class",
//                 "The trainer encouraged participation and enthusiasm throughout the class\u00a0"
//             ],
//         }];
//     } else {
//         // Keys for multi-trainer scenario (trainer name + number)
//         quantitativeQuestions = [{
//             question: questions.common[1],
//             keys: [trainerName],
//         }, {
//             question: questions.common[2],
//             keys: [`${trainerName}2`],
//         }, {
//             question: questions.common[3],
//             keys: [`${trainerName}3`],
//         }, {
//             question: questions.common[4],
//             keys: [`${trainerName}4`],
//         }];
//     }

//     const ratingValues = ["Excellent", "Very Good", "Good", "Average", "Poor"];
    
//     const getRatingCounts = (questionKeys) => {
//         const counts = {};
//         ratingValues.forEach(value => counts[value] = 0);
//         const normalizedQuestionKeys = questionKeys.map(normalizeKey);
        
//         responsesToProcess.forEach(response => {
//             let rating = null;
            
//             for (const key of Object.keys(response)) {
//                 if (normalizedQuestionKeys.includes(normalizeKey(key))) {
//                     rating = response[key];
//                     break;
//                 }
//             }

//             if (rating) {
//                 const normalizedRating = rating.replace("Very good", "Very Good");
//                 if (counts.hasOwnProperty(normalizedRating)) {
//                     counts[normalizedRating]++;
//                 }
//             }
//         });
//         return counts;
//     };

//     // Calculate all rating counts
//     const allQuestionCounts = quantitativeQuestions.map(q => getRatingCounts(q.keys));
    
//     // Start of new table drawing logic
//     const tableStartX = margin;
//     const ratingColWidth = 38;
//     const questionColWidth = (pageWidth - 2 * margin - ratingColWidth) / quantitativeQuestions.length;
//     const totalTableWidth = ratingColWidth + (questionColWidth * quantitativeQuestions.length);
    
//     const headerRowHeight = 24; // Increased height to fit wrapped text
//     const dataRowHeight = 12;
//     const numDataRows = ratingValues.length + 1; // 5 ratings + 1 total row
//     const totalTableHeight = headerRowHeight + (dataRowHeight * numDataRows);
    
//     doc.setLineWidth(0.5);
    
//     // Draw the main grid lines
//     doc.rect(tableStartX, y, totalTableWidth, totalTableHeight); // Outer rectangle
    
//     // Vertical lines
//     doc.line(tableStartX + ratingColWidth, y, tableStartX + ratingColWidth, y + totalTableHeight);
//     for (let i = 1; i <= quantitativeQuestions.length; i++) {
//         const x = tableStartX + ratingColWidth + (i * questionColWidth);
//         doc.line(x, y, x, y + totalTableHeight);
//     }
    
//     // Horizontal lines
//     doc.line(tableStartX, y + headerRowHeight, tableStartX + totalTableWidth, y + headerRowHeight);
//     for (let i = 0; i <= numDataRows; i++) {
//         doc.line(tableStartX, y + headerRowHeight + (i * dataRowHeight), tableStartX + totalTableWidth, y + headerRowHeight + (i * dataRowHeight));
//     }
    
//     // Populate the table with text
    
//     // Header cells
//     doc.setFontSize(8);
//     doc.setFont("helvetica", "bold");
//     let currentX = tableStartX + ratingColWidth;
//     quantitativeQuestions.forEach((q) => {
//         const questionLines = doc.splitTextToSize(q.question, questionColWidth - 4);
//         doc.text(questionLines, currentX + questionColWidth / 2, y + headerRowHeight / 2, { align: "center", baseline: "middle" });
//         currentX += questionColWidth;
//     });
    
//     // Rating rows
//     doc.setFont("helvetica", "normal");
//     ratingValues.forEach((rating, rowIndex) => {
//         currentX = tableStartX;
//         let rowY = y + headerRowHeight + (rowIndex * dataRowHeight);
        
//         // Rating label cell
//         doc.text(rating, currentX + ratingColWidth / 2, rowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
//         currentX += ratingColWidth;
        
//         // Count cells for each question
//         allQuestionCounts.forEach((counts) => {
//             const count = counts[rating];
//             doc.text(count.toString(), currentX + questionColWidth / 2, rowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
//             currentX += questionColWidth;
//         });
//     });
    
//     // Total responded trainees row
//     doc.setFont("helvetica", "bold");
//     let totalRowY = y + headerRowHeight + (ratingValues.length * dataRowHeight);
    
//     // "Total responded trainees" text in the first column
//     doc.text("Total responded\ntrainees", tableStartX + ratingColWidth / 2, totalRowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
    
//     // Total counts for each question
//     currentX = tableStartX + ratingColWidth;
//     for (let i = 0; i < quantitativeQuestions.length; i++) {
//         doc.text(totalResponses.toString(), currentX + questionColWidth / 2, totalRowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
//         currentX += questionColWidth;
//     }
    
//     y += totalTableHeight + 15;

//     // --- QUALITATIVE FEEDBACK SECTION ---
    
//     // Function to filter out generic comments
//     const filterComments = (comments) => {
//       const genericWords = ['nil', 'none', 'nothing', 'nothing specific', 'no comment', 'n/a', ''];
//       const uniqueComments = [...new Set(comments.map(c => c.toLowerCase().trim()))];
//       return uniqueComments.filter(c => !genericWords.includes(c));
//     };

//     // Function to summarize comments using the Gemini API
//     const summarizeComments = async (comments) => {
//       if (comments.length === 0) {
//         return "No significant comments to summarize.";
//       }
      
//       const apiKey = "AIzaSyC0GzgTH1rtB9EwARB8H98sZYB6AlBhAZs"; 
//       const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

//       if (!apiKey) {
//           console.error("API Key is missing. Please provide your own key to enable comment summarization.");
//           return "Unable to generate a summary at this time. An API key is required.";
//       }
      
//       const prompt = `Based on the following feedback comments from a training session, provide a concise summary of the key themes. Focus on the main points and overall sentiment.
      
//       Comments:
//       ${comments.join('\n- ')}
      
//       Summary:`;

//       let retries = 3;
//       while (retries > 0) {
//         try {
//           const payload = {
//             contents: [{ parts: [{ text: prompt }] }],
//             systemInstruction: { parts: [{ text: "You are a helpful assistant that summarizes feedback from trainees. Provide a single paragraph summary." }] },
//           };
//           const response = await fetch(apiUrl, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//           });
          
//           if (!response.ok) {
//               const errorText = await response.text();
//               throw new Error(`API call failed with status ${response.status}: ${errorText}`);
//           }
          
//           const result = await response.json();
//           const summary = result?.candidates?.[0]?.content?.parts?.[0]?.text;
//           if (summary) {
//             return summary;
//           } else {
//             throw new Error('API response was not in the expected format.');
//           }
//         } catch (error) {
//           console.error('Error summarizing comments:', error);
//           retries--;
//           if (retries > 0) {
//             await new Promise(resolve => setTimeout(resolve, 2000)); // Exponential backoff
//           }
//         }
//       }
//       return "Unable to generate a summary at this time. Please see raw comments for details.";
//     };

//     const whatWentWell = responsesToProcess.map(r => 
//         r[questions.common[5]] || 
//         r["What went well / things you most liked about the program "] || // Fallback keys for legacy data
//         r["What went well / things you most liked about the program\u00a0"]
//     ).filter(c => c && c.trim()).flat();
    
//     const whatNeedsImprovement = responsesToProcess.map(r => 
//         r[questions.common[6]] || 
//         r["What needs improvement / things you less liked about the program "] || // Fallback keys for legacy data
//         r["What needs improvement / things you less liked about the program\u00a0"]
//     ).filter(c => c && c.trim()).flat();
    
//     const filteredWentWell = filterComments(whatWentWell);
//     const filteredNeedsImprovement = filterComments(whatNeedsImprovement);
    
//     const wentWellSummary = await summarizeComments(filteredWentWell);
//     const needsImprovementSummary = await summarizeComments(filteredNeedsImprovement);
    
//     // Page break logic for "What went well" section
//     // Calculate required height before drawing
//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");
//     const wentWellTextLines = doc.splitTextToSize(wentWellSummary, pageWidth - (2 * margin));
//     const wentWellSectionHeight = 12 + (wentWellTextLines.length * 4) + 5;
    
//     if (y + wentWellSectionHeight > pageHeight - margin) {
//         doc.addPage();
//         y = margin;
//     }

//     // What went well section with colored header
//     doc.setFillColor(34, 139, 34); // Forest green
//     doc.rect(margin, y - 3, pageWidth - (2 * margin), 10, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(11);
//     doc.setFont("helvetica", "bold");
//     doc.text("What went well / things you most liked about the program (Summary)", margin + 2, y + 3);
//     y += 12;
    
//     doc.setTextColor(0, 0, 0);
//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");
//     doc.text(wentWellTextLines, margin, y);
//     y += (wentWellTextLines.length * 4) + 5;

//     // Page break logic for "What needs improvement" section
//     // Calculate required height before drawing
//     const needsImprovementTextLines = doc.splitTextToSize(needsImprovementSummary, pageWidth - (2 * margin));
//     const needsImprovementSectionHeight = 12 + (needsImprovementTextLines.length * 4) + 5;
    
//     if (y + needsImprovementSectionHeight > pageHeight - margin) {
//         doc.addPage();
//         y = margin;
//     }
    
//     // What needs improvement section with colored header
//     doc.setFillColor(220, 20, 60); // Crimson
//     doc.rect(margin, y - 3, pageWidth - (2 * margin), 10, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(11);
//     doc.setFont("helvetica", "bold");
//     doc.text("What needs improvement / things you less liked about the program (Summary)", margin + 2, y + 3);
//     y += 12;
    
//     doc.setTextColor(0, 0, 0);
//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");
//     doc.text(needsImprovementTextLines, margin, y);
//     y += (needsImprovementTextLines.length * 4) + 5;
    
//     // Hide loading message and save PDF
//     // document.body.removeChild(loadingMessage);
//     // const fileName = trainerName ? `${trainerName}_feedback.pdf` : "feedback_report.pdf";
//     // doc.save(fileName);
    
//     // --- Generate PDF Blob for preview ---
//     const pdfBlob = doc.output('blob');
//     const pdfUrl = URL.createObjectURL(pdfBlob);

//     // --- Create preview window dynamically below a specific div ---
//  const parentDiv = document.getElementById('container'); // replace with your div ID
// if (!parentDiv) return console.error("Parent div not found.");

// let previewContainer = document.getElementById('pdfPreviewContainer');
// if (!previewContainer) {
//     previewContainer = document.createElement('div');
//     previewContainer.id = 'pdfPreviewContainer';
//     previewContainer.style.cssText = `
//         width: 100%;
//         max-width: 800px;
//         margin: 20px auto;
//         padding: 15px;
//         border: 1px solid #e2e8f0;
//         border-radius: 12px;
//         background: #fff;
//         box-shadow: 0 4px 10px rgba(0,0,0,0.1);
//         text-align: center;
//     `;
//     parentDiv.insertAdjacentElement('afterend', previewContainer);
// }

// // Clear old content
// previewContainer.innerHTML = '';

// // Add iframe
// let iframe = document.createElement('iframe');
// iframe.id = 'pdfIframe';
// iframe.style.cssText = 'width:100%; height:500px; border:none;';
// iframe.src = pdfUrl;
// previewContainer.appendChild(iframe);

// // Download button
// const downloadBtn = document.createElement('button');
// downloadBtn.textContent = 'Download PDF';
// downloadBtn.className = 'secondary-btn';
// downloadBtn.style.marginTop = '15px';
// downloadBtn.onclick = () => doc.save(trainerName ? `${trainerName}_feedback.pdf` : "feedback_report.pdf");
// previewContainer.appendChild(downloadBtn);

// // Cancel button
// const cancelBtn = document.createElement('button');
// cancelBtn.textContent = 'Cancel Preview';
// cancelBtn.className = 'secondary-btn';
// cancelBtn.style.marginTop = '15px';
// cancelBtn.style.marginLeft = '10px';
// cancelBtn.onclick = () => {
//     previewContainer.remove();
//     URL.revokeObjectURL(pdfUrl);
// };
// previewContainer.appendChild(cancelBtn);

// }








// async function generateReport(responses, isSingleTrainer = false, trainerName = "") {
//     const { jsPDF } = window.jspdf;
//     const doc = new jsPDF();
//     let y = 20;
//     const margin = 10;
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const pageHeight = doc.internal.pageSize.getHeight();

//     // Helper function to normalize keys by removing whitespace and converting to lowercase
//     const normalizeKey = (key) => {
//         if (typeof key !== 'string') return '';
//         return key.replace(/\s+/g, ' ').trim().toLowerCase();
//     };

//     // Define a mapping from ratings to numerical values for weighted average calculation
//     const ratingValuesMap = {
//         "Excellent": 5,
//         "Very Good": 4,
//         "Very good": 4, // Handles both capitalizations
//         "Good": 3,
//         "Average": 2,
//         "Poor": 1
//     };

//     // Show a loading message while the report is being generated
//     const loadingMessage = document.createElement('div');
//     loadingMessage.textContent = 'Generating report... Please wait.';
//     loadingMessage.style.cssText = `
//         position: fixed;
//         top: 50%;
//         left: 50%;
//         transform: translate(-50%, -50%);
//         background-color: #f3f4f6;
//         padding: 20px 40px;
//         border-radius: 8px;
//         box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//         z-index: 1000;
//         font-family: 'Inter', sans-serif;
//     `;
//     document.body.appendChild(loadingMessage);

//     // Fetch questions from Firebase
//     let questions;
//     try {
//         const questionsRef = firebase.database().ref('questions');
//         const snapshot = await questionsRef.once('value');
//         questions = snapshot.val();
        
//         if (!questions) {
//             throw new Error('Questions not found in database');
//         }
//     } catch (error) {
//         console.error('Error fetching questions:', error);
//         // Fallback to hardcoded questions if Firebase fails
//         questions = {
//             common: {
//                 1: "The trainer provided me adequate opportunity to ask questions/clarify the concepts",
//                 2: "Included an appropriate number of activities, exercise, and interaction during the session",
//                 3: "The trainer is a subject matter expert and is approachable",
//                 4: "The trainer encouraged participation and enthusiasm throughout the class",
//                 5: "What went well / things you most liked about the program (Comments by trainees)",
//                 6: "What needs improvement / things you less liked about the program (Comments by trainees)"
//             },
//             singleTrainerOnly: {
//                 7: "Overall Program Rating — Out of 5"
//             }
//         };
//     }

//     // Determine which set of responses to use based on the isSingleTrainer flag
//     let responsesToProcess = responses;
//     if (!isSingleTrainer) {
//         responsesToProcess = responses.filter(r => r[trainerName] || r[`${trainerName}2`] || r[`${trainerName}3`] || r[`${trainerName}4`]);
//     }

//     // Calculate overall rating
//     const totalResponses = responsesToProcess.length;
//     let overallRating;

//     if (isSingleTrainer) {
//         const overallRatingKey = questions.singleTrainerOnly[7];
//         // Try multiple possible keys for overall rating
//         const possibleOverallKeys = [
//             "Overall program rating", // Exact key from your data
//             overallRatingKey, // Firebase version
//             "Overall Program Rating",
//             "Overall Program Rating — Out of 5"
//         ].map(normalizeKey);
        
//         let overallSum = 0;
//         let overallCount = 0;
//         responsesToProcess.forEach(r => {
//             const normalizedResponseKeys = Object.keys(r).map(normalizeKey);
//             for (const key of possibleOverallKeys) {
//                 const keyIndex = normalizedResponseKeys.indexOf(key);
//                 if (keyIndex !== -1) {
//                     const originalKey = Object.keys(r)[keyIndex];
//                     overallSum += Number(r[originalKey]) || 0;
//                     overallCount++;
//                     break; // Found a match, stop looking
//                 }
//             }
//         });
//         overallRating = overallCount > 0 ? overallSum / overallCount : 0;
//     } else {
//         let totalWeightedRating = 0;
//         const quantitativeQuestionKeys = [trainerName, `${trainerName}2`, `${trainerName}3`, `${trainerName}4`];
//         responsesToProcess.forEach(response => {
//             let traineeTotalRating = 0;
//             let questionCount = 0;
//             quantitativeQuestionKeys.forEach(key => {
//                 const rating = response[key];
//                 if (rating && ratingValuesMap.hasOwnProperty(rating)) {
//                     traineeTotalRating += ratingValuesMap[rating];
//                     questionCount++;
//                 }
//             });
//             if (questionCount > 0) {
//                 totalWeightedRating += traineeTotalRating / questionCount;
//             }
//         });
//         overallRating = totalResponses > 0 ? totalWeightedRating / totalResponses : 0;
//     }

//     // --- HEADER SECTION ---
//     // Title with colored background
//     doc.setFillColor(70, 130, 180); // Steel blue color
//     doc.rect(margin, y - 5, pageWidth - (2 * margin), 12, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(14);
//     doc.setFont("helvetica", "bold");
//     doc.text(`ILP - Tech Fundamentals Feedback—${trainerName}`, margin + 2, y + 2);
//     y += 20;

//     // Reset text color
//     doc.setTextColor(0, 0, 0);

//     // Summary info table
//     doc.setFontSize(10);
//     doc.setFont("helvetica", "bold");
    
//     const headers = ["Batch Name", "Total Trainee Count", "Trainer Name", "Overall Program Rating\nOut of 5"];
//     const values = ["ILP 2024-25 Batch", totalResponses.toString(), trainerName, overallRating.toFixed(2)];
    
//     const colWidth = (pageWidth - 2 * margin) / headers.length;
//     const summaryTableStartX = margin;
//     const headerHeight = 15; // Increased height for wrapping
//     const valueHeight = 8;
    
//     // Header row
//     headers.forEach((header, i) => {
//         const x = summaryTableStartX + (i * colWidth);
//         doc.rect(x, y, colWidth, headerHeight);
//         const headerLines = doc.splitTextToSize(header, colWidth - 4);
//         doc.text(headerLines, x + (colWidth / 2), y + headerHeight / 2, { align: "center", baseline: "middle" });
//     });
//     y += headerHeight;
    
//     // Value row
//     doc.setFont("helvetica", "normal");
//     values.forEach((value, i) => {
//         const x = summaryTableStartX + (i * colWidth);
//         doc.rect(x, y, colWidth, valueHeight);
//         doc.text(value, x + (colWidth / 2), y + 5, { align: "center", baseline: "middle" });
//     });
//     y += valueHeight + 20;

//     // --- RATING BREAKDOWN SECTION ---
//     let quantitativeQuestions;
    
//     if (isSingleTrainer) {
//         // Fallback to explicit keys for robustness with data inconsistencies
//         quantitativeQuestions = [{
//             question: questions.common[1],
//             keys: [
//                 "The trainer provided me adequate opportunity to ask questions/clarify the concepts",
//                 "The trainer provided me adequate opportunity to ask questions/clarify the concepts\u00a0"
//             ],
//         }, {
//             question: questions.common[2],
//             keys: [
//                 "Included an appropriate number of activities, exercise, and interaction during the session",
//                 "Included an appropriate number of activities, exercise, and interaction\u00a0during the session"
//             ],
//         }, {
//             question: questions.common[3],
//             keys: [
//                 "The trainer is a Subject Matter Expert and approachable ",
//                 "The trainer is a subject matter expert and is approachable",
//                 "The trainer is a subject matter expert and is approachable\u00a0",
//                 "The trainer is a subject matter expert and is approachable\n"
//             ],
//         }, {
//             question: questions.common[4],
//             keys: [
//                 "The trainer encouraged participation and enthusiasm throughout the class ",
//                 "The trainer encouraged participation and enthusiasm throughout the class",
//                 "The trainer encouraged participation and enthusiasm throughout the class\u00a0"
//             ],
//         }];
//     } else {
//         // Keys for multi-trainer scenario (trainer name + number)
//         quantitativeQuestions = [{
//             question: questions.common[1],
//             keys: [trainerName],
//         }, {
//             question: questions.common[2],
//             keys: [`${trainerName}2`],
//         }, {
//             question: questions.common[3],
//             keys: [`${trainerName}3`],
//         }, {
//             question: questions.common[4],
//             keys: [`${trainerName}4`],
//         }];
//     }

//     const ratingValues = ["Excellent", "Very Good", "Good", "Average", "Poor"];
    
//     const getRatingCounts = (questionKeys) => {
//         const counts = {};
//         ratingValues.forEach(value => counts[value] = 0);
//         const normalizedQuestionKeys = questionKeys.map(normalizeKey);
        
//         responsesToProcess.forEach(response => {
//             let rating = null;
            
//             for (const key of Object.keys(response)) {
//                 if (normalizedQuestionKeys.includes(normalizeKey(key))) {
//                     rating = response[key];
//                     break;
//                 }
//             }

//             if (rating) {
//                 const normalizedRating = rating.replace("Very good", "Very Good");
//                 if (counts.hasOwnProperty(normalizedRating)) {
//                     counts[normalizedRating]++;
//                 }
//             }
//         });
//         return counts;
//     };

//     // Calculate all rating counts
//     const allQuestionCounts = quantitativeQuestions.map(q => getRatingCounts(q.keys));
    
//     // Start of new table drawing logic
//     const tableStartX = margin;
//     const ratingColWidth = 38;
//     const questionColWidth = (pageWidth - 2 * margin - ratingColWidth) / quantitativeQuestions.length;
//     const totalTableWidth = ratingColWidth + (questionColWidth * quantitativeQuestions.length);
    
//     const headerRowHeight = 24; // Increased height to fit wrapped text
//     const dataRowHeight = 12;
//     const numDataRows = ratingValues.length + 1; // 5 ratings + 1 total row
//     const totalTableHeight = headerRowHeight + (dataRowHeight * numDataRows);
    
//     doc.setLineWidth(0.5);
    
//     // Draw the main grid lines
//     doc.rect(tableStartX, y, totalTableWidth, totalTableHeight); // Outer rectangle
    
//     // Vertical lines
//     doc.line(tableStartX + ratingColWidth, y, tableStartX + ratingColWidth, y + totalTableHeight);
//     for (let i = 1; i <= quantitativeQuestions.length; i++) {
//         const x = tableStartX + ratingColWidth + (i * questionColWidth);
//         doc.line(x, y, x, y + totalTableHeight);
//     }
    
//     // Horizontal lines
//     doc.line(tableStartX, y + headerRowHeight, tableStartX + totalTableWidth, y + headerRowHeight);
//     for (let i = 0; i <= numDataRows; i++) {
//         doc.line(tableStartX, y + headerRowHeight + (i * dataRowHeight), tableStartX + totalTableWidth, y + headerRowHeight + (i * dataRowHeight));
//     }
    
//     // Populate the table with text
    
//     // Header cells
//     doc.setFontSize(8);
//     doc.setFont("helvetica", "bold");
//     let currentX = tableStartX + ratingColWidth;
//     quantitativeQuestions.forEach((q) => {
//         const questionLines = doc.splitTextToSize(q.question, questionColWidth - 4);
//         doc.text(questionLines, currentX + questionColWidth / 2, y + headerRowHeight / 2, { align: "center", baseline: "middle" });
//         currentX += questionColWidth;
//     });
    
//     // Rating rows
//     doc.setFont("helvetica", "normal");
//     ratingValues.forEach((rating, rowIndex) => {
//         currentX = tableStartX;
//         let rowY = y + headerRowHeight + (rowIndex * dataRowHeight);
        
//         // Rating label cell
//         doc.text(rating, currentX + ratingColWidth / 2, rowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
//         currentX += ratingColWidth;
        
//         // Count cells for each question
//         allQuestionCounts.forEach((counts) => {
//             const count = counts[rating];
//             doc.text(count.toString(), currentX + questionColWidth / 2, rowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
//             currentX += questionColWidth;
//         });
//     });
    
//     // Total responded trainees row
//     doc.setFont("helvetica", "bold");
//     let totalRowY = y + headerRowHeight + (ratingValues.length * dataRowHeight);
    
//     // "Total responded trainees" text in the first column
//     doc.text("Total responded\ntrainees", tableStartX + ratingColWidth / 2, totalRowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
    
//     // Total counts for each question
//     currentX = tableStartX + ratingColWidth;
//     for (let i = 0; i < quantitativeQuestions.length; i++) {
//         doc.text(totalResponses.toString(), currentX + questionColWidth / 2, totalRowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
//         currentX += questionColWidth;
//     }
    
//     y += totalTableHeight + 20;

//     // --- QUALITATIVE FEEDBACK SECTION ---
    
//     // Function to filter out generic comments
//     const filterComments = (comments) => {
//       const genericWords = ['nil', 'none', 'nothing', 'nothing specific', 'no comment', 'n/a', ''];
//       const uniqueComments = [...new Set(comments.map(c => c.toLowerCase().trim()))];
//       return uniqueComments.filter(c => !genericWords.includes(c));
//     };

//     // Function to summarize comments using the Gemini API
//     const summarizeComments = async (comments) => {
//       if (comments.length === 0) {
//         return "No significant comments to summarize.";
//       }
      
//       const apiKey = "AIzaSyC0GzgTH1rtB9EwARB8H98sZYB6AlBhAZs"; 
//       const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

//       if (!apiKey) {
//           console.error("API Key is missing. Please provide your own key to enable comment summarization.");
//           return "Unable to generate a summary at this time. An API key is required.";
//       }
      
//       const prompt = `Based on the following feedback comments from a training session, provide a concise summary of the key themes. Focus on the main points and overall sentiment.
      
//       Comments:
//       ${comments.join('\n- ')}
      
//       Summary:`;

//       let retries = 3;
//       while (retries > 0) {
//         try {
//           const payload = {
//             contents: [{ parts: [{ text: prompt }] }],
//             systemInstruction: { parts: [{ text: "You are a helpful assistant that summarizes feedback from trainees. Provide a single paragraph summary." }] },
//           };
//           const response = await fetch(apiUrl, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//           });
          
//           if (!response.ok) {
//               const errorText = await response.text();
//               throw new Error(`API call failed with status ${response.status}: ${errorText}`);
//           }
          
//           const result = await response.json();
//           const summary = result?.candidates?.[0]?.content?.parts?.[0]?.text;
//           if (summary) {
//             return summary;
//           } else {
//             throw new Error('API response was not in the expected format.');
//           }
//         } catch (error) {
//           console.error('Error summarizing comments:', error);
//           retries--;
//           if (retries > 0) {
//             await new Promise(resolve => setTimeout(resolve, 2000)); // Exponential backoff
//           }
//         }
//       }
//       return "Unable to generate a summary at this time. Please see raw comments for details.";
//     };

//     const whatWentWell = responsesToProcess.map(r => 
//         r[questions.common[5]] || 
//         r["What went well / things you most liked about the program "] || // Fallback keys for legacy data
//         r["What went well / things you most liked about the program\u00a0"]
//     ).filter(c => c && c.trim()).flat();
    
//     const whatNeedsImprovement = responsesToProcess.map(r => 
//         r[questions.common[6]] || 
//         r["What needs improvement / things you less liked about the program "] || // Fallback keys for legacy data
//         r["What needs improvement / things you less liked about the program\u00a0"]
//     ).filter(c => c && c.trim()).flat();
    
//     const filteredWentWell = filterComments(whatWentWell);
//     const filteredNeedsImprovement = filterComments(whatNeedsImprovement);
    
//     const wentWellSummary = await summarizeComments(filteredWentWell);
//     const needsImprovementSummary = await summarizeComments(filteredNeedsImprovement);
    
//     // Page break logic for "What went well" section
//     // Calculate required height before drawing
//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");
//     const wentWellTextLines = doc.splitTextToSize(wentWellSummary, pageWidth - (2 * margin));
//     const wentWellSectionHeight = 15 + (wentWellTextLines.length * 4) + 10;
    
//     if (y + wentWellSectionHeight > pageHeight - margin) {
//         doc.addPage();
//         y = margin;
//     }

//     // What went well section with colored header
//     doc.setFillColor(34, 139, 34); // Forest green
//     doc.rect(margin, y - 3, pageWidth - (2 * margin), 10, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(11);
//     doc.setFont("helvetica", "bold");
//     doc.text("What went well / things you most liked about the program (Summary)", margin + 2, y + 3);
//     y += 15;
    
//     doc.setTextColor(0, 0, 0);
//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");
//     doc.text(wentWellTextLines, margin, y);
//     y += (wentWellTextLines.length * 4) + 10;

//     // Page break logic for "What needs improvement" section
//     // Calculate required height before drawing
//     const needsImprovementTextLines = doc.splitTextToSize(needsImprovementSummary, pageWidth - (2 * margin));
//     const needsImprovementSectionHeight = 15 + (needsImprovementTextLines.length * 4) + 10;
    
//     if (y + needsImprovementSectionHeight > pageHeight - margin) {
//         doc.addPage();
//         y = margin;
//     }
    
//     // What needs improvement section with colored header
//     doc.setFillColor(220, 20, 60); // Crimson
//     doc.rect(margin, y - 3, pageWidth - (2 * margin), 10, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(11);
//     doc.setFont("helvetica", "bold");
//     doc.text("What needs improvement / things you less liked about the program (Summary)", margin + 2, y + 3);
//     y += 15;
    
//     doc.setTextColor(0, 0, 0);
//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");
//     doc.text(needsImprovementTextLines, margin, y);
//     y += (needsImprovementTextLines.length * 4) + 10;
    
//     // Hide loading message and save PDF
//     document.body.removeChild(loadingMessage);
//     const fileName = trainerName ? `${trainerName}_feedback.pdf` : "feedback_report.pdf";
//     doc.save(fileName);
// }


// async function generateReport(responses, isSingleTrainer = false, trainerName = "") {
//     const { jsPDF } = window.jspdf;
//     const doc = new jsPDF();
//     let y = 20;
//     const margin = 10;
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const pageHeight = doc.internal.pageSize.getHeight();

//     // Helper function to normalize keys by removing whitespace and converting to lowercase
//     const normalizeKey = (key) => {
//         if (typeof key !== 'string') return '';
//         return key.replace(/\s+/g, ' ').trim().toLowerCase();
//     };

//     // Define a mapping from ratings to numerical values for weighted average calculation
//     const ratingValuesMap = {
//         "Excellent": 5,
//         "Very Good": 4,
//         "Very good": 4, // Handles both capitalizations
//         "Good": 3,
//         "Average": 2,
//         "Poor": 1
//     };

//     // Show a loading message while the report is being generated
//     const loadingMessage = document.createElement('div');
//     loadingMessage.textContent = 'Generating report... Please wait.';
//     loadingMessage.style.cssText = `
//         position: fixed;
//         top: 50%;
//         left: 50%;
//         transform: translate(-50%, -50%);
//         background-color: #f3f4f6;
//         padding: 20px 40px;
//         border-radius: 8px;
//         box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//         z-index: 1000;
//         font-family: 'Inter', sans-serif;
//     `;
//     document.body.appendChild(loadingMessage);

//     // Fetch questions from Firebase
//     let questions;
//     try {
//         const questionsRef = firebase.database().ref('questions');
//         const snapshot = await questionsRef.once('value');
//         questions = snapshot.val();
        
//         if (!questions) {
//             throw new Error('Questions not found in database');
//         }
//     } catch (error) {
//         console.error('Error fetching questions:', error);
//         // Fallback to hardcoded questions if Firebase fails
//         questions = {
//             common: {
//                 1: "The trainer provided me adequate opportunity to ask questions/clarify the concepts",
//                 2: "Included an appropriate number of activities, exercise, and interaction during the session",
//                 3: "The trainer is a subject matter expert and is approachable",
//                 4: "The trainer encouraged participation and enthusiasm throughout the class",
//                 5: "What went well / things you most liked about the program (Comments by trainees)",
//                 6: "What needs improvement / things you less liked about the program (Comments by trainees)"
//             },
//             singleTrainerOnly: {
//                 7: "Overall Program Rating — Out of 5"
//             }
//         };
//     }

//     // Determine which set of responses to use based on the isSingleTrainer flag
//     let responsesToProcess = responses;
//     if (!isSingleTrainer) {
//         responsesToProcess = responses.filter(r => r[trainerName] || r[`${trainerName}2`] || r[`${trainerName}3`] || r[`${trainerName}4`]);
//     }

//     // Calculate overall rating
//     const totalResponses = responsesToProcess.length;
//     let overallRating;

//     if (isSingleTrainer) {
//         const overallRatingKey = questions.singleTrainerOnly[7];
//         // Try multiple possible keys for overall rating
//         const possibleOverallKeys = [
//             "Overall program rating", // Exact key from your data
//             overallRatingKey, // Firebase version
//             "Overall Program Rating",
//             "Overall Program Rating — Out of 5"
//         ].map(normalizeKey);
        
//         let overallSum = 0;
//         let overallCount = 0;
//         responsesToProcess.forEach(r => {
//             const normalizedResponseKeys = Object.keys(r).map(normalizeKey);
//             for (const key of possibleOverallKeys) {
//                 const keyIndex = normalizedResponseKeys.indexOf(key);
//                 if (keyIndex !== -1) {
//                     const originalKey = Object.keys(r)[keyIndex];
//                     overallSum += Number(r[originalKey]) || 0;
//                     overallCount++;
//                     break; // Found a match, stop looking
//                 }
//             }
//         });
//         overallRating = overallCount > 0 ? overallSum / overallCount : 0;
//     } else {
//         let totalWeightedRating = 0;
//         const quantitativeQuestionKeys = [trainerName, `${trainerName}2`, `${trainerName}3`, `${trainerName}4`];
//         responsesToProcess.forEach(response => {
//             let traineeTotalRating = 0;
//             let questionCount = 0;
//             quantitativeQuestionKeys.forEach(key => {
//                 const rating = response[key];
//                 if (rating && ratingValuesMap.hasOwnProperty(rating)) {
//                     traineeTotalRating += ratingValuesMap[rating];
//                     questionCount++;
//                 }
//             });
//             if (questionCount > 0) {
//                 totalWeightedRating += traineeTotalRating / questionCount;
//             }
//         });
//         overallRating = totalResponses > 0 ? totalWeightedRating / totalResponses : 0;
//     }

//     // --- HEADER SECTION ---
//     // Title with colored background
//     doc.setFillColor(70, 130, 180); // Steel blue color
//     doc.rect(margin, y - 5, pageWidth - (2 * margin), 12, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(14);
//     doc.setFont("helvetica", "bold");
//     doc.text(`ILP - Tech Fundamentals Feedback—${trainerName}`, margin + 2, y + 2);
//     y += 20;

//     // Reset text color
//     doc.setTextColor(0, 0, 0);

//     // Summary info table
//     doc.setFontSize(10);
//     doc.setFont("helvetica", "bold");
    
//     const headers = ["Batch Name", "Total Trainee Count", "Trainer Name", "Overall Program Rating\nOut of 5"];
//     const values = ["ILP 2024-25 Batch", totalResponses.toString(), trainerName, overallRating.toFixed(2)];
    
//     const colWidth = (pageWidth - 2 * margin) / headers.length;
//     const summaryTableStartX = margin;
//     const headerHeight = 15; // Increased height for wrapping
//     const valueHeight = 8;
    
//     // Header row
//     headers.forEach((header, i) => {
//         const x = summaryTableStartX + (i * colWidth);
//         doc.rect(x, y, colWidth, headerHeight);
//         const headerLines = doc.splitTextToSize(header, colWidth - 4);
//         doc.text(headerLines, x + (colWidth / 2), y + headerHeight / 2, { align: "center", baseline: "middle" });
//     });
//     y += headerHeight;
    
//     // Value row
//     doc.setFont("helvetica", "normal");
//     values.forEach((value, i) => {
//         const x = summaryTableStartX + (i * colWidth);
//         doc.rect(x, y, colWidth, valueHeight);
//         doc.text(value, x + (colWidth / 2), y + 5, { align: "center", baseline: "middle" });
//     });
//     y += valueHeight + 20;

//     // --- RATING BREAKDOWN SECTION ---
//     let quantitativeQuestions;
    
//     if (isSingleTrainer) {
//         // Fallback to explicit keys for robustness with data inconsistencies
//         quantitativeQuestions = [{
//             question: questions.common[1],
//             keys: [
//                 "The trainer provided me adequate opportunity to ask questions/clarify the concepts",
//                 "The trainer provided me adequate opportunity to ask questions/clarify the concepts\u00a0"
//             ],
//         }, {
//             question: questions.common[2],
//             keys: [
//                 "Included an appropriate number of activities, exercise, and interaction during the session",
//                 "Included an appropriate number of activities, exercise, and interaction\u00a0during the session"
//             ],
//         }, {
//             question: questions.common[3],
//             keys: [
//                 "The trainer is a Subject Matter Expert and approachable ",
//                 "The trainer is a subject matter expert and is approachable",
//                 "The trainer is a subject matter expert and is approachable\u00a0",
//                 "The trainer is a subject matter expert and is approachable\n"
//             ],
//         }, {
//             question: questions.common[4],
//             keys: [
//                 "The trainer encouraged participation and enthusiasm throughout the class ",
//                 "The trainer encouraged participation and enthusiasm throughout the class",
//                 "The trainer encouraged participation and enthusiasm throughout the class\u00a0"
//             ],
//         }];
//     } else {
//         // Keys for multi-trainer scenario (trainer name + number)
//         quantitativeQuestions = [{
//             question: questions.common[1],
//             keys: [trainerName],
//         }, {
//             question: questions.common[2],
//             keys: [`${trainerName}2`],
//         }, {
//             question: questions.common[3],
//             keys: [`${trainerName}3`],
//         }, {
//             question: questions.common[4],
//             keys: [`${trainerName}4`],
//         }];
//     }

//     const ratingValues = ["Excellent", "Very Good", "Good", "Average", "Poor"];
    
//     const getRatingCounts = (questionKeys) => {
//         const counts = {};
//         ratingValues.forEach(value => counts[value] = 0);
//         const normalizedQuestionKeys = questionKeys.map(normalizeKey);
        
//         responsesToProcess.forEach(response => {
//             let rating = null;
            
//             for (const key of Object.keys(response)) {
//                 if (normalizedQuestionKeys.includes(normalizeKey(key))) {
//                     rating = response[key];
//                     break;
//                 }
//             }

//             if (rating) {
//                 const normalizedRating = rating.replace("Very good", "Very Good");
//                 if (counts.hasOwnProperty(normalizedRating)) {
//                     counts[normalizedRating]++;
//                 }
//             }
//         });
//         return counts;
//     };

//     // Calculate all rating counts
//     const allQuestionCounts = quantitativeQuestions.map(q => getRatingCounts(q.keys));
    
//     // Start of new table drawing logic
//     const tableStartX = margin;
//     const ratingColWidth = 38;
//     const questionColWidth = (pageWidth - 2 * margin - ratingColWidth) / quantitativeQuestions.length;
//     const totalTableWidth = ratingColWidth + (questionColWidth * quantitativeQuestions.length);
    
//     const headerRowHeight = 24; // Increased height to fit wrapped text
//     const dataRowHeight = 12;
//     const numDataRows = ratingValues.length + 1; // 5 ratings + 1 total row
//     const totalTableHeight = headerRowHeight + (dataRowHeight * numDataRows);
    
//     doc.setLineWidth(0.5);
    
//     // Draw the main grid lines
//     doc.rect(tableStartX, y, totalTableWidth, totalTableHeight); // Outer rectangle
    
//     // Vertical lines
//     doc.line(tableStartX + ratingColWidth, y, tableStartX + ratingColWidth, y + totalTableHeight);
//     for (let i = 1; i <= quantitativeQuestions.length; i++) {
//         const x = tableStartX + ratingColWidth + (i * questionColWidth);
//         doc.line(x, y, x, y + totalTableHeight);
//     }
    
//     // Horizontal lines
//     doc.line(tableStartX, y + headerRowHeight, tableStartX + totalTableWidth, y + headerRowHeight);
//     for (let i = 0; i <= numDataRows; i++) {
//         doc.line(tableStartX, y + headerRowHeight + (i * dataRowHeight), tableStartX + totalTableWidth, y + headerRowHeight + (i * dataRowHeight));
//     }
    
//     // Populate the table with text
    
//     // Header cells
//     doc.setFontSize(8);
//     doc.setFont("helvetica", "bold");
//     let currentX = tableStartX + ratingColWidth;
//     quantitativeQuestions.forEach((q) => {
//         const questionLines = doc.splitTextToSize(q.question, questionColWidth - 4);
//         doc.text(questionLines, currentX + questionColWidth / 2, y + headerRowHeight / 2, { align: "center", baseline: "middle" });
//         currentX += questionColWidth;
//     });
    
//     // Rating rows
//     doc.setFont("helvetica", "normal");
//     ratingValues.forEach((rating, rowIndex) => {
//         currentX = tableStartX;
//         let rowY = y + headerRowHeight + (rowIndex * dataRowHeight);
        
//         // Rating label cell
//         doc.text(rating, currentX + ratingColWidth / 2, rowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
//         currentX += ratingColWidth;
        
//         // Count cells for each question
//         allQuestionCounts.forEach((counts) => {
//             const count = counts[rating];
//             doc.text(count.toString(), currentX + questionColWidth / 2, rowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
//             currentX += questionColWidth;
//         });
//     });
    
//     // Total responded trainees row
//     doc.setFont("helvetica", "bold");
//     let totalRowY = y + headerRowHeight + (ratingValues.length * dataRowHeight);
    
//     // "Total responded trainees" text in the first column
//     doc.text("Total responded\ntrainees", tableStartX + ratingColWidth / 2, totalRowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
    
//     // Total counts for each question
//     currentX = tableStartX + ratingColWidth;
//     for (let i = 0; i < quantitativeQuestions.length; i++) {
//         doc.text(totalResponses.toString(), currentX + questionColWidth / 2, totalRowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
//         currentX += questionColWidth;
//     }
    
//     y += totalTableHeight + 20;

//     // --- QUALITATIVE FEEDBACK SECTION ---
    
//     // Function to filter out generic comments
//     const filterComments = (comments) => {
//       const genericWords = ['nil', 'none', 'nothing', 'nothing specific', 'no comment', 'n/a', ''];
//       const uniqueComments = [...new Set(comments.map(c => c.toLowerCase().trim()))];
//       return uniqueComments.filter(c => !genericWords.includes(c));
//     };

//     // Function to summarize comments using the Gemini API
//     const summarizeComments = async (comments) => {
//       if (comments.length === 0) {
//         return "No significant comments to summarize.";
//       }
      
//       const apiKey = "AIzaSyC0GzgTH1rtB9EwARB8H98sZYB6AlBhAZs"; 
//       const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

//       if (!apiKey) {
//           console.error("API Key is missing. Please provide your own key to enable comment summarization.");
//           return "Unable to generate a summary at this time. An API key is required.";
//       }
      
//       const prompt = `Based on the following feedback comments from a training session, provide a concise summary of the key themes. Focus on the main points and overall sentiment.
      
//       Comments:
//       ${comments.join('\n- ')}
      
//       Summary:`;

//       let retries = 3;
//       while (retries > 0) {
//         try {
//           const payload = {
//             contents: [{ parts: [{ text: prompt }] }],
//             systemInstruction: { parts: [{ text: "You are a helpful assistant that summarizes feedback from trainees. Provide a single paragraph summary." }] },
//           };
//           const response = await fetch(apiUrl, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//           });
          
//           if (!response.ok) {
//               const errorText = await response.text();
//               throw new Error(`API call failed with status ${response.status}: ${errorText}`);
//           }
          
//           const result = await response.json();
//           const summary = result?.candidates?.[0]?.content?.parts?.[0]?.text;
//           if (summary) {
//             return summary;
//           } else {
//             throw new Error('API response was not in the expected format.');
//           }
//         } catch (error) {
//           console.error('Error summarizing comments:', error);
//           retries--;
//           if (retries > 0) {
//             await new Promise(resolve => setTimeout(resolve, 2000)); // Exponential backoff
//           }
//         }
//       }
//       return "Unable to generate a summary at this time. Please see raw comments for details.";
//     };

//     const whatWentWell = responsesToProcess.map(r => 
//         r[questions.common[5]] || 
//         r["What went well / things you most liked about the program "] || // Fallback keys for legacy data
//         r["What went well / things you most liked about the program\u00a0"]
//     ).filter(c => c && c.trim()).flat();
    
//     const whatNeedsImprovement = responsesToProcess.map(r => 
//         r[questions.common[6]] || 
//         r["What needs improvement / things you less liked about the program "] || // Fallback keys for legacy data
//         r["What needs improvement / things you less liked about the program\u00a0"]
//     ).filter(c => c && c.trim()).flat();
    
//     const filteredWentWell = filterComments(whatWentWell);
//     const filteredNeedsImprovement = filterComments(whatNeedsImprovement);
    
//     const wentWellSummary = await summarizeComments(filteredWentWell);
//     const needsImprovementSummary = await summarizeComments(filteredNeedsImprovement);
    
//     // Page break logic for "What went well" section
//     // If we are close to the bottom, add a new page
//     if (y > pageHeight - 60) {
//         doc.addPage();
//         y = margin;
//     }

//     // What went well section with colored header
//     doc.setFillColor(34, 139, 34); // Forest green
//     doc.rect(margin, y - 3, pageWidth - (2 * margin), 10, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(11);
//     doc.setFont("helvetica", "bold");
//     doc.text("What went well / things you most liked about the program (Summary)", margin + 2, y + 3);
//     y += 15;
    
//     doc.setTextColor(0, 0, 0);
//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");
//     const wentWellTextLines = doc.splitTextToSize(wentWellSummary, pageWidth - (2 * margin));
//     doc.text(wentWellTextLines, margin, y);
//     y += (wentWellTextLines.length * 4) + 10;

//     // Page break logic for "What needs improvement" section
//     // If we are close to the bottom, add a new page
//     if (y > pageHeight - 60) {
//         doc.addPage();
//         y = margin;
//     }
    
//     // What needs improvement section with colored header
//     doc.setFillColor(220, 20, 60); // Crimson
//     doc.rect(margin, y - 3, pageWidth - (2 * margin), 10, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(11);
//     doc.setFont("helvetica", "bold");
//     doc.text("What needs improvement / things you less liked about the program (Summary)", margin + 2, y + 3);
//     y += 15;
    
//     doc.setTextColor(0, 0, 0);
//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");
//     const needsImprovementTextLines = doc.splitTextToSize(needsImprovementSummary, pageWidth - (2 * margin));
//     doc.text(needsImprovementTextLines, margin, y);
//     y += (needsImprovementTextLines.length * 4) + 10;
    
//     // Hide loading message and save PDF
//     document.body.removeChild(loadingMessage);
//     const fileName = trainerName ? `${trainerName}_feedback.pdf` : "feedback_report.pdf";
//     doc.save(fileName);
// }



// async function generateReport(responses, isSingleTrainer = false, trainerName = "") {
//     const { jsPDF } = window.jspdf;
//     const doc = new jsPDF();
//     let y = 20;
//     const margin = 10;
//     const pageWidth = doc.internal.pageSize.getWidth();

//     // Helper function to normalize keys by removing whitespace and converting to lowercase
//     const normalizeKey = (key) => {
//         if (typeof key !== 'string') return '';
//         return key.replace(/\s+/g, ' ').trim().toLowerCase();
//     };

//     // Define a mapping from ratings to numerical values for weighted average calculation
//     const ratingValuesMap = {
//         "Excellent": 5,
//         "Very Good": 4,
//         "Very good": 4, // Handles both capitalizations
//         "Good": 3,
//         "Average": 2,
//         "Poor": 1
//     };

//     // Show a loading message while the report is being generated
//     const loadingMessage = document.createElement('div');
//     loadingMessage.textContent = 'Generating report... Please wait.';
//     loadingMessage.style.cssText = `
//         position: fixed;
//         top: 50%;
//         left: 50%;
//         transform: translate(-50%, -50%);
//         background-color: #f3f4f6;
//         padding: 20px 40px;
//         border-radius: 8px;
//         box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//         z-index: 1000;
//         font-family: 'Inter', sans-serif;
//     `;
//     document.body.appendChild(loadingMessage);

//     // Fetch questions from Firebase
//     let questions;
//     try {
//         const questionsRef = firebase.database().ref('questions');
//         const snapshot = await questionsRef.once('value');
//         questions = snapshot.val();
        
//         if (!questions) {
//             throw new Error('Questions not found in database');
//         }
//     } catch (error) {
//         console.error('Error fetching questions:', error);
//         // Fallback to hardcoded questions if Firebase fails
//         questions = {
//             common: {
//                 1: "The trainer provided me adequate opportunity to ask questions/clarify the concepts",
//                 2: "Included an appropriate number of activities, exercise, and interaction during the session",
//                 3: "The trainer is a subject matter expert and is approachable",
//                 4: "The trainer encouraged participation and enthusiasm throughout the class",
//                 5: "What went well / things you most liked about the program (Comments by trainees)",
//                 6: "What needs improvement / things you less liked about the program (Comments by trainees)"
//             },
//             singleTrainerOnly: {
//                 7: "Overall Program Rating — Out of 5"
//             }
//         };
//     }

//     // Determine which set of responses to use based on the isSingleTrainer flag
//     let responsesToProcess = responses;
//     if (!isSingleTrainer) {
//         responsesToProcess = responses.filter(r => r[trainerName] || r[`${trainerName}2`] || r[`${trainerName}3`] || r[`${trainerName}4`]);
//     }

//     // Calculate overall rating
//     const totalResponses = responsesToProcess.length;
//     let overallRating;

//     if (isSingleTrainer) {
//         const overallRatingKey = questions.singleTrainerOnly[7];
//         // Try multiple possible keys for overall rating
//         const possibleOverallKeys = [
//             "Overall program rating", // Exact key from your data
//             overallRatingKey, // Firebase version
//             "Overall Program Rating",
//             "Overall Program Rating — Out of 5"
//         ].map(normalizeKey);
        
//         let overallSum = 0;
//         let overallCount = 0;
//         responsesToProcess.forEach(r => {
//             const normalizedResponseKeys = Object.keys(r).map(normalizeKey);
//             for (const key of possibleOverallKeys) {
//                 const keyIndex = normalizedResponseKeys.indexOf(key);
//                 if (keyIndex !== -1) {
//                     const originalKey = Object.keys(r)[keyIndex];
//                     overallSum += Number(r[originalKey]) || 0;
//                     overallCount++;
//                     break; // Found a match, stop looking
//                 }
//             }
//         });
//         overallRating = overallCount > 0 ? overallSum / overallCount : 0;
//     } else {
//         let totalWeightedRating = 0;
//         const quantitativeQuestionKeys = [trainerName, `${trainerName}2`, `${trainerName}3`, `${trainerName}4`];
//         responsesToProcess.forEach(response => {
//             let traineeTotalRating = 0;
//             let questionCount = 0;
//             quantitativeQuestionKeys.forEach(key => {
//                 const rating = response[key];
//                 if (rating && ratingValuesMap.hasOwnProperty(rating)) {
//                     traineeTotalRating += ratingValuesMap[rating];
//                     questionCount++;
//                 }
//             });
//             if (questionCount > 0) {
//                 totalWeightedRating += traineeTotalRating / questionCount;
//             }
//         });
//         overallRating = totalResponses > 0 ? totalWeightedRating / totalResponses : 0;
//     }

//     // --- HEADER SECTION ---
//     // Title with colored background
//     doc.setFillColor(70, 130, 180); // Steel blue color
//     doc.rect(margin, y - 5, pageWidth - (2 * margin), 12, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(14);
//     doc.setFont("helvetica", "bold");
//     doc.text(`ILP - Tech Fundamentals Feedback—${trainerName}`, margin + 2, y + 2);
//     y += 20;

//     // Reset text color
//     doc.setTextColor(0, 0, 0);

//     // Summary info table
//     doc.setFontSize(10);
//     doc.setFont("helvetica", "bold");
    
//     const headers = ["Batch Name", "Total Trainee Count", "Trainer Name", "Overall Program Rating\nOut of 5"];
//     const values = ["ILP 2024-25 Batch", totalResponses.toString(), trainerName, overallRating.toFixed(2)];
    
//     const colWidth = (pageWidth - 2 * margin) / headers.length;
//     const summaryTableStartX = margin;
//     const headerHeight = 15; // Increased height for wrapping
//     const valueHeight = 8;
    
//     // Header row
//     headers.forEach((header, i) => {
//         const x = summaryTableStartX + (i * colWidth);
//         doc.rect(x, y, colWidth, headerHeight);
//         const headerLines = doc.splitTextToSize(header, colWidth - 4);
//         doc.text(headerLines, x + (colWidth / 2), y + headerHeight / 2, { align: "center", baseline: "middle" });
//     });
//     y += headerHeight;
    
//     // Value row
//     doc.setFont("helvetica", "normal");
//     values.forEach((value, i) => {
//         const x = summaryTableStartX + (i * colWidth);
//         doc.rect(x, y, colWidth, valueHeight);
//         doc.text(value, x + (colWidth / 2), y + 5, { align: "center", baseline: "middle" });
//     });
//     y += valueHeight + 20;

//     // --- RATING BREAKDOWN SECTION ---
//     let quantitativeQuestions;
    
//     if (isSingleTrainer) {
//         // Fallback to explicit keys for robustness with data inconsistencies
//         quantitativeQuestions = [{
//             question: questions.common[1],
//             keys: [
//                 "The trainer provided me adequate opportunity to ask questions/clarify the concepts",
//                 "The trainer provided me adequate opportunity to ask questions/clarify the concepts\u00a0"
//             ],
//         }, {
//             question: questions.common[2],
//             keys: [
//                 "Included an appropriate number of activities, exercise, and interaction during the session",
//                 "Included an appropriate number of activities, exercise, and interaction\u00a0during the session"
//             ],
//         }, {
//             question: questions.common[3],
//             keys: [
//                 "The trainer is a Subject Matter Expert and approachable ",
//                 "The trainer is a subject matter expert and is approachable",
//                 "The trainer is a subject matter expert and is approachable\u00a0",
//                 "The trainer is a subject matter expert and is approachable\n"
//             ],
//         }, {
//             question: questions.common[4],
//             keys: [
//                 "The trainer encouraged participation and enthusiasm throughout the class ",
//                 "The trainer encouraged participation and enthusiasm throughout the class",
//                 "The trainer encouraged participation and enthusiasm throughout the class\u00a0"
//             ],
//         }];
//     } else {
//         // Keys for multi-trainer scenario (trainer name + number)
//         quantitativeQuestions = [{
//             question: questions.common[1],
//             keys: [trainerName],
//         }, {
//             question: questions.common[2],
//             keys: [`${trainerName}2`],
//         }, {
//             question: questions.common[3],
//             keys: [`${trainerName}3`],
//         }, {
//             question: questions.common[4],
//             keys: [`${trainerName}4`],
//         }];
//     }

//     const ratingValues = ["Excellent", "Very Good", "Good", "Average", "Poor"];
    
//     const getRatingCounts = (questionKeys) => {
//         const counts = {};
//         ratingValues.forEach(value => counts[value] = 0);
//         const normalizedQuestionKeys = questionKeys.map(normalizeKey);
        
//         responsesToProcess.forEach(response => {
//             let rating = null;
            
//             for (const key of Object.keys(response)) {
//                 if (normalizedQuestionKeys.includes(normalizeKey(key))) {
//                     rating = response[key];
//                     break;
//                 }
//             }

//             if (rating) {
//                 const normalizedRating = rating.replace("Very good", "Very Good");
//                 if (counts.hasOwnProperty(normalizedRating)) {
//                     counts[normalizedRating]++;
//                 }
//             }
//         });
//         return counts;
//     };

//     // Calculate all rating counts
//     const allQuestionCounts = quantitativeQuestions.map(q => getRatingCounts(q.keys));
    
//     // Start of new table drawing logic
//     const tableStartX = margin;
//     const ratingColWidth = 38;
//     const questionColWidth = (pageWidth - 2 * margin - ratingColWidth) / quantitativeQuestions.length;
//     const totalTableWidth = ratingColWidth + (questionColWidth * quantitativeQuestions.length);
    
//     const headerRowHeight = 24; // Increased height to fit wrapped text
//     const dataRowHeight = 12;
//     const numDataRows = ratingValues.length + 1; // 5 ratings + 1 total row
//     const totalTableHeight = headerRowHeight + (dataRowHeight * numDataRows);
    
//     doc.setLineWidth(0.5);
    
//     // Draw the main grid lines
//     doc.rect(tableStartX, y, totalTableWidth, totalTableHeight); // Outer rectangle
    
//     // Vertical lines
//     doc.line(tableStartX + ratingColWidth, y, tableStartX + ratingColWidth, y + totalTableHeight);
//     for (let i = 1; i <= quantitativeQuestions.length; i++) {
//         const x = tableStartX + ratingColWidth + (i * questionColWidth);
//         doc.line(x, y, x, y + totalTableHeight);
//     }
    
//     // Horizontal lines
//     doc.line(tableStartX, y + headerRowHeight, tableStartX + totalTableWidth, y + headerRowHeight);
//     for (let i = 0; i <= numDataRows; i++) {
//         doc.line(tableStartX, y + headerRowHeight + (i * dataRowHeight), tableStartX + totalTableWidth, y + headerRowHeight + (i * dataRowHeight));
//     }
    
//     // Populate the table with text
    
//     // Header cells
//     doc.setFontSize(8);
//     doc.setFont("helvetica", "bold");
//     let currentX = tableStartX + ratingColWidth;
//     quantitativeQuestions.forEach((q) => {
//         const questionLines = doc.splitTextToSize(q.question, questionColWidth - 4);
//         doc.text(questionLines, currentX + questionColWidth / 2, y + headerRowHeight / 2, { align: "center", baseline: "middle" });
//         currentX += questionColWidth;
//     });
    
//     // Rating rows
//     doc.setFont("helvetica", "normal");
//     ratingValues.forEach((rating, rowIndex) => {
//         currentX = tableStartX;
//         let rowY = y + headerRowHeight + (rowIndex * dataRowHeight);
        
//         // Rating label cell
//         doc.text(rating, currentX + ratingColWidth / 2, rowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
//         currentX += ratingColWidth;
        
//         // Count cells for each question
//         allQuestionCounts.forEach((counts) => {
//             const count = counts[rating];
//             doc.text(count.toString(), currentX + questionColWidth / 2, rowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
//             currentX += questionColWidth;
//         });
//     });
    
//     // Total responded trainees row
//     doc.setFont("helvetica", "bold");
//     let totalRowY = y + headerRowHeight + (ratingValues.length * dataRowHeight);
    
//     // "Total responded trainees" text in the first column
//     doc.text("Total responded\ntrainees", tableStartX + ratingColWidth / 2, totalRowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
    
//     // Total counts for each question
//     currentX = tableStartX + ratingColWidth;
//     for (let i = 0; i < quantitativeQuestions.length; i++) {
//         doc.text(totalResponses.toString(), currentX + questionColWidth / 2, totalRowY + dataRowHeight / 2, { align: "center", baseline: "middle" });
//         currentX += questionColWidth;
//     }
    
//     y += totalTableHeight + 20;

//     // --- QUALITATIVE FEEDBACK SECTION ---
    
//     // Function to filter out generic comments
//     const filterComments = (comments) => {
//       const genericWords = ['nil', 'none', 'nothing', 'nothing specific', 'no comment', 'n/a', ''];
//       const uniqueComments = [...new Set(comments.map(c => c.toLowerCase().trim()))];
//       return uniqueComments.filter(c => !genericWords.includes(c));
//     };

//     // Function to summarize comments using the Gemini API
//     const summarizeComments = async (comments) => {
//       if (comments.length === 0) {
//         return "No significant comments to summarize.";
//       }
      
//       const apiKey = "AIzaSyC0GzgTH1rtB9EwARB8H98sZYB6AlBhAZs"; 
//       const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

//       if (!apiKey) {
//           console.error("API Key is missing. Please provide your own key to enable comment summarization.");
//           return "Unable to generate a summary at this time. An API key is required.";
//       }
      
//       const prompt = `Based on the following feedback comments from a training session, provide a concise summary of the key themes. Focus on the main points and overall sentiment.
      
//       Comments:
//       ${comments.join('\n- ')}
      
//       Summary:`;

//       let retries = 3;
//       while (retries > 0) {
//         try {
//           const payload = {
//             contents: [{ parts: [{ text: prompt }] }],
//             systemInstruction: { parts: [{ text: "You are a helpful assistant that summarizes feedback from trainees. Provide a single paragraph summary." }] },
//           };
//           const response = await fetch(apiUrl, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//           });
          
//           if (!response.ok) {
//               const errorText = await response.text();
//               throw new Error(`API call failed with status ${response.status}: ${errorText}`);
//           }
          
//           const result = await response.json();
//           const summary = result?.candidates?.[0]?.content?.parts?.[0]?.text;
//           if (summary) {
//             return summary;
//           } else {
//             throw new Error('API response was not in the expected format.');
//           }
//         } catch (error) {
//           console.error('Error summarizing comments:', error);
//           retries--;
//           if (retries > 0) {
//             await new Promise(resolve => setTimeout(resolve, 2000)); // Exponential backoff
//           }
//         }
//       }
//       return "Unable to generate a summary at this time. Please see raw comments for details.";
//     };

//     const whatWentWell = responsesToProcess.map(r => 
//         r[questions.common[5]] || 
//         r["What went well / things you most liked about the program "] || // Fallback keys for legacy data
//         r["What went well / things you most liked about the program\u00a0"]
//     ).filter(c => c && c.trim()).flat();
    
//     const whatNeedsImprovement = responsesToProcess.map(r => 
//         r[questions.common[6]] || 
//         r["What needs improvement / things you less liked about the program "] || // Fallback keys for legacy data
//         r["What needs improvement / things you less liked about the program\u00a0"]
//     ).filter(c => c && c.trim()).flat();
    
//     const filteredWentWell = filterComments(whatWentWell);
//     const filteredNeedsImprovement = filterComments(whatNeedsImprovement);
    
//     const wentWellSummary = await summarizeComments(filteredWentWell);
//     const needsImprovementSummary = await summarizeComments(filteredNeedsImprovement);

//     // Dynamic page-break check before "What went well" section
//     const wentWellHeaderHeight = 15;
//     const wentWellTextLines = doc.splitTextToSize(wentWellSummary, pageWidth - (2 * margin));
//     const wentWellTextHeight = wentWellTextLines.length * 4;
//     const wentWellSectionHeight = wentWellHeaderHeight + wentWellTextHeight + 10;
    
//     if (y + wentWellSectionHeight > doc.internal.pageSize.getHeight() - margin) {
//         doc.addPage();
//         y = margin;
//     }

//     // What went well section with colored header
//     doc.setFillColor(34, 139, 34); // Forest green
//     doc.rect(margin, y - 3, pageWidth - (2 * margin), 10, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(11);
//     doc.setFont("helvetica", "bold");
//     doc.text("What went well / things you most liked about the program (Summary)", margin + 2, y + 3);
//     y += 15;
    
//     doc.setTextColor(0, 0, 0);
//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");
//     doc.text(wentWellTextLines, margin, y);
//     y += wentWellTextHeight + 10;

//     // Dynamic page-break check before "What needs improvement" section
//     const needsImprovementHeaderHeight = 15;
//     const needsImprovementTextLines = doc.splitTextToSize(needsImprovementSummary, pageWidth - (2 * margin));
//     const needsImprovementTextHeight = needsImprovementTextLines.length * 4;
//     const needsImprovementSectionHeight = needsImprovementHeaderHeight + needsImprovementTextHeight + 10;

//     if (y + needsImprovementSectionHeight > doc.internal.pageSize.getHeight() - margin) {
//         doc.addPage();
//         y = margin;
//     }
    
//     // What needs improvement section with colored header
//     doc.setFillColor(220, 20, 60); // Crimson
//     doc.rect(margin, y - 3, pageWidth - (2 * margin), 10, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(11);
//     doc.setFont("helvetica", "bold");
//     doc.text("What needs improvement / things you less liked about the program (Summary)", margin + 2, y + 3);
//     y += 15;
    
//     doc.setTextColor(0, 0, 0);
//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");
//     doc.text(needsImprovementTextLines, margin, y);
//     y += needsImprovementTextHeight + 10;
    
//     // Hide loading message and save PDF
//     document.body.removeChild(loadingMessage);
//     const fileName = trainerName ? `${trainerName}_feedback.pdf` : "feedback_report.pdf";
//     doc.save(fileName);
// }


// async function generateReport(responses, isSingleTrainer = false, trainerName = "") {
//     const { jsPDF } = window.jspdf;
//     const doc = new jsPDF();
//     let y = 20;

//     // Helper function to normalize keys by removing whitespace and converting to lowercase
//     const normalizeKey = (key) => {
//         if (typeof key !== 'string') return '';
//         return key.replace(/\s+/g, ' ').trim().toLowerCase();
//     };

//     // Define a mapping from ratings to numerical values for weighted average calculation
//     const ratingValuesMap = {
//         "Excellent": 5,
//         "Very Good": 4,
//         "Very good": 4, // Handles both capitalizations
//         "Good": 3,
//         "Average": 2,
//         "Poor": 1
//     };
    
//     // Show a loading message while the report is being generated
//     const loadingMessage = document.createElement('div');
//     loadingMessage.textContent = 'Generating report... Please wait.';
//     loadingMessage.style.cssText = `
//         position: fixed;
//         top: 50%;
//         left: 50%;
//         transform: translate(-50%, -50%);
//         background-color: #f3f4f6;
//         padding: 20px 40px;
//         border-radius: 8px;
//         box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//         z-index: 1000;
//         font-family: 'Inter', sans-serif;
//     `;
//     document.body.appendChild(loadingMessage);

//     // Fetch questions from Firebase
//     let questions;
//     try {
//         const questionsRef = firebase.database().ref('questions');
//         const snapshot = await questionsRef.once('value');
//         questions = snapshot.val();
        
//         if (!questions) {
//             throw new Error('Questions not found in database');
//         }
//     } catch (error) {
//         console.error('Error fetching questions:', error);
//         // Fallback to hardcoded questions if Firebase fails
//         questions = {
//             common: {
//                 1: "The trainer provided me adequate opportunity to ask questions/clarify the concepts",
//                 2: "Included an appropriate number of activities, exercise, and interaction during the session",
//                 3: "The trainer is a subject matter expert and is approachable",
//                 4: "The trainer encouraged participation and enthusiasm throughout the class",
//                 5: "What went well / things you most liked about the program (Comments by trainees)",
//                 6: "What needs improvement / things you less liked about the program (Comments by trainees)"
//             },
//             singleTrainerOnly: {
//                 7: "Overall Program Rating — Out of 5"
//             }
//         };
//     }

//     // Determine which set of responses to use based on the isSingleTrainer flag
//     let responsesToProcess = responses;
//     if (!isSingleTrainer) {
//         responsesToProcess = responses.filter(r => r[trainerName] || r[`${trainerName}2`] || r[`${trainerName}3`] || r[`${trainerName}4`]);
//     }

//     // Calculate overall rating
//     const totalResponses = responsesToProcess.length;
//     let overallRating;

//     if (isSingleTrainer) {
//         const overallRatingKey = questions.singleTrainerOnly[7];
//         // Try multiple possible keys for overall rating
//         const possibleOverallKeys = [
//             "Overall program rating", // Exact key from your data
//             overallRatingKey, // Firebase version
//             "Overall Program Rating",
//             "Overall Program Rating — Out of 5"
//         ].map(normalizeKey);
        
//         let overallSum = 0;
//         let overallCount = 0;
//         responsesToProcess.forEach(r => {
//             const normalizedResponseKeys = Object.keys(r).map(normalizeKey);
//             for (const key of possibleOverallKeys) {
//                 const keyIndex = normalizedResponseKeys.indexOf(key);
//                 if (keyIndex !== -1) {
//                     const originalKey = Object.keys(r)[keyIndex];
//                     overallSum += Number(r[originalKey]) || 0;
//                     overallCount++;
//                     break; // Found a match, stop looking
//                 }
//             }
//         });
//         overallRating = overallCount > 0 ? overallSum / overallCount : 0;
//     } else {
//         let totalWeightedRating = 0;
//         const quantitativeQuestionKeys = [trainerName, `${trainerName}2`, `${trainerName}3`, `${trainerName}4`];
//         responsesToProcess.forEach(response => {
//             let traineeTotalRating = 0;
//             let questionCount = 0;
//             quantitativeQuestionKeys.forEach(key => {
//                 const rating = response[key];
//                 if (rating && ratingValuesMap.hasOwnProperty(rating)) {
//                     traineeTotalRating += ratingValuesMap[rating];
//                     questionCount++;
//                 }
//             });
//             if (questionCount > 0) {
//                 totalWeightedRating += traineeTotalRating / questionCount;
//             }
//         });
//         overallRating = totalResponses > 0 ? totalWeightedRating / totalResponses : 0;
//     }

//     // --- HEADER SECTION ---
//     // Title with colored background
//     doc.setFillColor(70, 130, 180); // Steel blue color
//     doc.rect(10, y - 5, 190, 12, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(14);
//     doc.setFont("helvetica", "bold");
//     doc.text(`ILP - Tech Fundamentals Feedback—${trainerName}`, 12, y + 2);
//     y += 20;

//     // Reset text color
//     doc.setTextColor(0, 0, 0);

//     // Summary info table
//     doc.setFontSize(10);
//     doc.setFont("helvetica", "bold");
    
//     const headers = ["Batch Name", "Total Trainee Count", "Trainer Name", "Overall Program Rating—Out of 5"];
//     const values = ["ILP 2024-25 Batch", totalResponses.toString(), trainerName, overallRating.toFixed(2)];
    
//     const colWidth = 47;
//     const summaryTableStartX = 10;
//     const headerHeight = 10;
//     const valueHeight = 8;
    
//     // Header row
//     headers.forEach((header, i) => {
//         const x = summaryTableStartX + (i * colWidth);
//         doc.rect(x, y, colWidth, headerHeight);
//         const headerLines = doc.splitTextToSize(header, colWidth - 4);
//         doc.text(headerLines, x + 2, y + 4, { align: "center", baseline: "middle" });
//     });
//     y += headerHeight;
    
//     // Value row
//     doc.setFont("helvetica", "normal");
//     values.forEach((value, i) => {
//         const x = summaryTableStartX + (i * colWidth);
//         doc.rect(x, y, colWidth, valueHeight);
//         doc.text(value, x + 2, y + 5);
//     });
//     y += valueHeight + 20;

//     // --- RATING BREAKDOWN SECTION ---
//     let quantitativeQuestions;
    
//     if (isSingleTrainer) {
//         // Fallback to explicit keys for robustness with data inconsistencies
//         quantitativeQuestions = [{
//             question: questions.common[1],
//             keys: [
//                 "The trainer provided me adequate opportunity to ask questions/clarify the concepts",
//                 "The trainer provided me adequate opportunity to ask questions/clarify the concepts\u00a0"
//             ],
//         }, {
//             question: questions.common[2],
//             keys: [
//                 "Included an appropriate number of activities, exercise, and interaction during the session",
//                 "Included an appropriate number of activities, exercise, and interaction\u00a0during the session"
//             ],
//         }, {
//             question: questions.common[3],
//             keys: [
//                 "The trainer is a Subject Matter Expert and approachable ",
//                 "The trainer is a subject matter expert and is approachable",
//                 "The trainer is a subject matter expert and is approachable\u00a0",
//                 "The trainer is a subject matter expert and is approachable\n"
//             ],
//         }, {
//             question: questions.common[4],
//             keys: [
//                 "The trainer encouraged participation and enthusiasm throughout the class ",
//                 "The trainer encouraged participation and enthusiasm throughout the class",
//                 "The trainer encouraged participation and enthusiasm throughout the class\u00a0"
//             ],
//         }];
//     } else {
//         // Keys for multi-trainer scenario (trainer name + number)
//         quantitativeQuestions = [{
//             question: questions.common[1],
//             keys: [trainerName],
//         }, {
//             question: questions.common[2],
//             keys: [`${trainerName}2`],
//         }, {
//             question: questions.common[3],
//             keys: [`${trainerName}3`],
//         }, {
//             question: questions.common[4],
//             keys: [`${trainerName}4`],
//         }];
//     }

//     const ratingValues = ["Excellent", "Very Good", "Good", "Average", "Poor"];
    
//     const getRatingCounts = (questionKeys) => {
//         const counts = {};
//         ratingValues.forEach(value => counts[value] = 0);
//         const normalizedQuestionKeys = questionKeys.map(normalizeKey);
        
//         responsesToProcess.forEach(response => {
//             let rating = null;
            
//             for (const key of Object.keys(response)) {
//                 if (normalizedQuestionKeys.includes(normalizeKey(key))) {
//                     rating = response[key];
//                     break;
//                 }
//             }

//             if (rating) {
//                 const normalizedRating = rating.replace("Very good", "Very Good");
//                 if (counts.hasOwnProperty(normalizedRating)) {
//                     counts[normalizedRating]++;
//                 }
//             }
//         });
//         return counts;
//     };

//     // Calculate all rating counts
//     const allQuestionCounts = quantitativeQuestions.map(q => getRatingCounts(q.keys));

//     // Create the comprehensive rating table matching the reference PDF
//     const tableStartX = 10;
//     const ratingColWidth = 38;
//     const questionColWidth = 38;
//     const rowHeight = 12;
    
//     doc.setFontSize(8);
//     doc.setFont("helvetica", "bold");
    
//     // Draw question headers row
//     let currentX = tableStartX;
//     let headerY = y;
    
//     // Empty corner cell
//     doc.setLineWidth(0.5);
//     doc.rect(currentX, headerY, ratingColWidth, rowHeight * 2);
//     currentX += ratingColWidth;
    
//     // Question header cells
//     quantitativeQuestions.forEach((q) => {
//         doc.rect(currentX, headerY, questionColWidth, rowHeight * 2);
        
//         // Split and wrap question text
//         const questionLines = doc.splitTextToSize(q.question, questionColWidth - 2);
//         let textY = headerY + 3;
//         questionLines.forEach((line, index) => {
//             if (index < 6) { // Limit to fit in cell
//                 doc.text(line, currentX + 1, textY);
//                 textY += 3;
//             }
//         });
//         currentX += questionColWidth;
//     });
    
//     y += rowHeight * 2;
    
//     // Rating rows
//     doc.setFont("helvetica", "normal");
//     ratingValues.forEach((rating) => {
//         currentX = tableStartX;
        
//         // Rating label cell
//         doc.rect(currentX, y, ratingColWidth, rowHeight);
//         doc.text(rating, currentX + 2, y + 8);
//         currentX += ratingColWidth;
        
//         // Count cells for each question
//         quantitativeQuestions.forEach((q, questionIndex) => {
//             doc.rect(currentX, y, questionColWidth, rowHeight);
//             const count = allQuestionCounts[questionIndex][rating];
//             const textWidth = doc.getTextWidth(count.toString());
//             const centerX = currentX + (questionColWidth - textWidth) / 2;
//             doc.text(count.toString(), centerX, y + 8);
//             currentX += questionColWidth;
//         });
//         y += rowHeight;
//     });

//     // Total responded trainees row
//     currentX = tableStartX;
//     doc.setFont("helvetica", "bold");
    
//     // Total label cell
//     doc.rect(currentX, y, ratingColWidth, rowHeight);
//     doc.text("Total responded", currentX + 2, y + 5);
//     doc.text("trainees", currentX + 2, y + 9);
//     currentX += ratingColWidth;
    
//     // Total count cells
//     quantitativeQuestions.forEach(() => {
//         doc.rect(currentX, y, questionColWidth, rowHeight);
//         const textWidth = doc.getTextWidth(totalResponses.toString());
//         const centerX = currentX + (questionColWidth - textWidth) / 2;
//             doc.text(totalResponses.toString(), centerX, y + 8);
//         currentX += questionColWidth;
//     });
    
//     y += rowHeight + 20;

//     // --- QUALITATIVE FEEDBACK SECTION ---

//     // Function to filter out generic comments
//     const filterComments = (comments) => {
//       const genericWords = ['nil', 'none', 'nothing', 'nothing specific', 'no comment', 'n/a', ''];
//       const uniqueComments = [...new Set(comments.map(c => c.toLowerCase().trim()))];
//       return uniqueComments.filter(c => !genericWords.includes(c));
//     };

//     // Function to summarize comments using the Gemini API
//     const summarizeComments = async (comments) => {
//       if (comments.length === 0) {
//         return "No significant comments to summarize.";
//       }
//       const prompt = `Based on the following feedback comments from a training session, provide a concise summary of the key themes. Focus on the main points and overall sentiment.
      
//       Comments:
//       ${comments.join('\n- ')}
      
//       Summary:`;

//       const apiKey = "AIzaSyC0GzgTH1rtB9EwARB8H98sZYB6AlBhAZs";
//       const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

//       let retries = 3;
//       while (retries > 0) {
//         try {
//           const payload = {
//             contents: [{ parts: [{ text: prompt }] }],
//             systemInstruction: { parts: [{ text: "You are a helpful assistant that summarizes feedback from trainees. Provide a single paragraph summary." }] },
//           };
//           const response = await fetch(apiUrl, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//           });
//           const result = await response.json();
//           const summary = result?.candidates?.[0]?.content?.parts?.[0]?.text;
//           if (summary) {
//             return summary;
//           } else {
//             throw new Error('API response was not in the expected format.');
//           }
//         } catch (error) {
//           console.error('Error summarizing comments:', error);
//           retries--;
//           if (retries > 0) {
//             await new Promise(resolve => setTimeout(resolve, 2000)); // Exponential backoff
//           }
//         }
//       }
//       return "Unable to generate a summary at this time. Please see raw comments for details.";
//     };

//     const whatWentWell = responsesToProcess.map(r => 
//         r[questions.common[5]] || 
//         r["What went well / things you most liked about the program "] || // Fallback keys for legacy data
//         r["What went well / things you most liked about the program\u00a0"]
//     ).filter(c => c && c.trim()).flat();
    
//     const whatNeedsImprovement = responsesToProcess.map(r => 
//         r[questions.common[6]] || 
//         r["What needs improvement / things you less liked about the program "] || // Fallback keys for legacy data
//         r["What needs improvement / things you less liked about the program\u00a0"]
//     ).filter(c => c && c.trim()).flat();
    
//     const filteredWentWell = filterComments(whatWentWell);
//     const filteredNeedsImprovement = filterComments(whatNeedsImprovement);
    
//     const wentWellSummary = await summarizeComments(filteredWentWell);
//     const needsImprovementSummary = await summarizeComments(filteredNeedsImprovement);

//     if (y > 200) {
//         doc.addPage();
//         y = 20;
//     }

//     // What went well section with colored header
//     doc.setFillColor(34, 139, 34); // Forest green
//     doc.rect(10, y - 3, 190, 10, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(11);
//     doc.setFont("helvetica", "bold");
//     doc.text("What went well / things you most liked about the program (Summary)", 12, y + 3);
//     y += 15;
    
//     doc.setTextColor(0, 0, 0);
//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");
//     const wentWellText = doc.splitTextToSize(wentWellSummary, 180);
//     doc.text(wentWellText, 12, y);
//     y += (wentWellText.length * 4) + 10;

//     // What needs improvement section with colored header
//     if (y > 240) {
//         doc.addPage();
//         y = 20;
//     }
    
//     doc.setFillColor(220, 20, 60); // Crimson
//     doc.rect(10, y - 3, 190, 10, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(11);
//     doc.setFont("helvetica", "bold");
//     doc.text("What needs improvement / things you less liked about the program (Summary)", 12, y + 3);
//     y += 15;
    
//     doc.setTextColor(0, 0, 0);
//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");
//     const needsImprovementText = doc.splitTextToSize(needsImprovementSummary, 180);
//     doc.text(needsImprovementText, 12, y);
//     y += (needsImprovementText.length * 4) + 10;
    
//     // Hide loading message and save PDF
//     document.body.removeChild(loadingMessage);
//     const fileName = trainerName ? `${trainerName}_feedback.pdf` : "feedback_report.pdf";
//     doc.save(fileName);
// }
// api key:"AIzaSyC0GzgTH1rtB9EwARB8H98sZYB6AlBhAZs"



 


 

 


 