//ePayment Chaincode
//Author:Ashok Khatua And Savitri Sonnad
//Date:19/04/2019
package main

import (
	//"bytes"
	//	"encoding/json"

	"encoding/json"
	"encoding/xml"
	"fmt"

	//	"io/ioutil"
	//	"os"
	//	"path/filepath"
	//	"strconv"
	//	"strings"

	_ "github.com/go-sql-driver/mysql"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}

//RequestPayload
type RequestPayload struct {
	XMLName xml.Name `xml:"RequestPayload" json:"-"`
	//	ObjectType 	string 		`json:"docType"` //field for couchdb
	AppHdr   AppHdr     `xml:"AppHdr" json:"AppHdr"`
	Document []Document `xml:"Document"`
}

type AppHdr struct {
	XMLName xml.Name `xml:"AppHdr" json:"-"`
	//	ObjectType 	string 		`json:"docType"` //field for couchdb
	CreDt     string `xml:"CreDt" json:"CreDt"`
	BizMsgIdr string `xml:"BizMsgIdr" json:"BizMsgIdr"`
}

//Document
type Document struct {
	XMLName xml.Name `xml:"Document" json:"-"`
	//ObjectType 		 	string 				`json:"docType"` //field for couchdb
	CstmrCdtTrfInitn CstmrCdtTrfInitn `xml:"CstmrCdtTrfInitn" json:"CstmrCdtTrfInitn"`
}

type CstmrCdtTrfInitn struct {
	XMLName xml.Name `xml:"CstmrCdtTrfInitn" json:"-"`
	PmtInf  []PmtInf `xml:"PmtInf" json:"PmtInf"`
}

type PmtInf struct {
	XMLName     xml.Name      `xml:"PmtInf" json:"-"`
	CdtTrfTxInf []CdtTrfTxInf `xml:"CdtTrfTxInf" json:"CdtTrfTxInf"`
	DbtrAcct    DbtrAcct      `xml:"DbtrAcct" json:"DbtrAcct"`
	DbtrAgt     DbtrAgt       `xml:"DbtrAgt" json:"DbtrAgt"`
}

//CdtTrfTxInf
type CdtTrfTxInf struct {
	XMLName  xml.Name `xml:"CdtTrfTxInf" json:"-"`
	PmtId    PmtId    `xml:"PmtId" json:"PmtId"`
	Amt      Amt      `xml:"Amt" json:"Amt"`
	CdtrAcct CdtrAcct `xml:"CdtrAcct" json:"CdtrAcct"`
}

type PmtId struct {
	XMLName    xml.Name `xml:"PmtId" json:"-"`
	EndToEndId string   `xml:"EndToEndId" json:"EndToEndId"`
}

type Amt struct {
	XMLName  xml.Name   `xml:"Amt" json:"-"`
	InstdAmt []InstdAmt `xml:"InstdAmt" json:"InstdAmt"`
}

type InstdAmt struct {
	XMLName  xml.Name `xml:"InstdAmt" json:"-"`
	Amt      string   `xml:"Amt" json:"Amt"`
	CcyOfTrf string   `xml:"CcyOfTrf" json:"CcyOfTrf"`
}

//DbtrAcct
type DbtrAcct struct {
	XMLName xml.Name `xml:"DbtrAcct" json:"-"`
	Id      Id       `xml:"Id" json:"Id"`
}

type Id struct {
	XMLName xml.Name `xml:"Id" json:"-"`
	Othr    Othr     `xml:"Othr" json:"Othr"`
}

type Othr struct {
	XMLName xml.Name `xml:"Othr" json:"-"`
	Id      string   `xml:"Id" json:"Id"`
}

//DbtrAgt
type DbtrAgt struct {
	XMLName    xml.Name   `xml:"DbtrAgt" json:"-"`
	FinInstnId FinInstnId `xml:"FinInstnId" json:"FinInstnId"`
}

type FinInstnId struct {
	XMLName     xml.Name    `xml:"FinInstnId" json:"-"`
	ClrSysMmbId ClrSysMmbId `xml:"ClrSysMmbId" json:"ClrSysMmbId"`
}

type ClrSysMmbId struct {
	XMLName xml.Name `xml:"ClrSysMmbId" json:"-"`
	MmbId   string   `xml:"MmbId" json:"MmbId"`
}

//CdtrAcct
type CdtrAcct struct {
	XMLName xml.Name `xml:"CdtrAcct" json:"-"`
	Id      Id       `xml:"Id" json:"Id"`
}

type RequiredFields struct {
	FileName   string `json:"FileName"`
	EndToEndId string `json:"EndToEndId"`
	Amt        string `json:"Amt"`
	CrdtId     string `json:"CrdtId"`
	DbtId      string `json:"DbtId"`
	CreDt      string `json:"CreDt"`
	Ack        string `json:"Ack"`
	Scroll     string `json:"Scroll"`
}

type LedgerData struct {
	FileName          string `json:"FileName"`
	EndToEndId        string `json:"EndToEndId"`
	Amt               string `json:"Amt"`
	CrdtId            string `json:"CrdtId"`
	DbtId             string `json:"DbtId"`
	CreDt             string `json:"CreDt"`
	Ack               string `json:"Ack"`
	Scroll            string `json:"Scroll"`
	Isendtoendiunique string `json:"isendtoendiunique"`
}

type AckFileData struct {
	OrgnlEndToEndId string `xml:"OrgnlEndToEndId" json:"OrgnlEndToEndId"`
	GrpSts          string `xml:"GrpSts" json:"GrpSts"`
}

type ScrollFileData struct {
	EndToEndId string `xml:"EndToEndId" json:"EndToEndId"`
	Prtry      string `xml:"Prtry" json:"Prtry"`
}

// ===================================================================================
// Main
// ===================================================================================
func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	return shim.Success(nil)
}

// Invoke - Our entry point for Invocations
// ========================================
func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	// Retrieve the requested Smart Contract function and arguments
	function, args := stub.GetFunctionAndParameters()
	fmt.Println("invoke is running " + function)
	// Route to the appropriate handler function to interact with the ledger appropriately
	if function == "init" { //initialize the chaincode state, used as reset
		return t.Init(stub)
	} else if function == "readEndToEndIdFromLedger" {
		return t.readEndToEndIdFromLedger(stub, args)
	} else if function == "saveDetailsToLedger" {
		return t.saveDetailsToLedger(stub, args)
	} else if function == "checkEndToEndIdExists" {
		return t.checkEndToEndIdExists(stub, args)
	} else if function == "saveAckDetailsToLedger" {
		return t.saveAckDetailsToLedger(stub, args)
	} else if function == "saveScrollDetailsToLedger" {
		return t.saveScrollDetailsToLedger(stub, args)
	}
	fmt.Println("Received unknown invoke function name - " + function)
	return shim.Error("Received unknown invoke function name - '" + function + "'")
}

//Read from ledger by passing entire array as key
// func (t *SimpleChaincode) readEndToEndIdFromLedger(stub shim.ChaincodeStubInterface, args []string) pb.Response {
// 	var key, jsonResp string
// 	var err error
// 	fmt.Println("starting read")
// 	fmt.Println("Printing args...", args[0])
// 	if len(args) != 1 {
// 		return shim.Error("Incorrect number of arguments. Expecting key of the var to query")
// 	}

// 	key = args[0]
// 	valAsbytes, err := stub.GetState(key) //get the var from ledger
// 	if err != nil {
// 		jsonResp = "{\"Error\":\"Failed to get state for " + key + "\"}"
// 		return shim.Error(jsonResp)
// 	}
// 	fmt.Println("valAsbytes===", string(valAsbytes))
// 	fmt.Println("- end read")
// 	return shim.Success(valAsbytes)

// }

//Read from ledger by passing EndToEndId as key
func (t *SimpleChaincode) readEndToEndIdFromLedger(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var key, jsonResp string
	var err error
	fmt.Println("starting read")
	fmt.Println("Printing args...", args[0])
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting key of the var to query")
	}
	var requiredFields []RequiredFields
	var valAsbytes []byte

	data := []byte(args[0])

	//	var requiredFields RequiredFields
	if err := json.Unmarshal(data, &requiredFields); err != nil {
		panic(err)
	}

	fmt.Println(requiredFields)
	i := 0
	for i < len(requiredFields) {
		key = requiredFields[i].EndToEndId
		fmt.Println("key=====", key)
		valAsbytes, err = stub.GetState(key) //get the var from ledger
		if err != nil {
			jsonResp = "{\"Error\":\"Failed to get state for " + key + "\"}"
			return shim.Error(jsonResp)
		}
		fmt.Println("valAsbytes===", string(valAsbytes))
		i = i + 1
	}

	//fmt.Println("- end read")
	return shim.Success(valAsbytes)
}

//Write to ledger by passing EndtoEndId as key
func (t *SimpleChaincode) saveDetailsToLedger(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	fmt.Println("starting saveDetailsToLedger function....!!!")

	var status = "true"
	fmt.Println("printing arguments", args)

	var requiredFields []RequiredFields

	data := []byte(args[0])

	//	var requiredFields RequiredFields
	if err := json.Unmarshal(data, &requiredFields); err != nil {
		panic(err)
	}

	fmt.Println(requiredFields)

	i := 0
	for i < len(requiredFields) {
		requiredFieldsAsBytes, _ := json.Marshal(requiredFields[i])        //convert to array of bytes
		stub.PutState(requiredFields[i].EndToEndId, requiredFieldsAsBytes) //store owner by its Id

		fmt.Println("Added", requiredFields[i])
		i = i + 1
	}
	fmt.Println("end saveDetailsToLedger function....!!!")
	// return shim.Success(requiredFieldsAsBytes)
	return shim.Success([]byte(status))

}

//EndToEndId duplicate check
func (t *SimpleChaincode) checkEndToEndIdExists(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	fmt.Println("starting checkEndToEndIdExists function....!!!")
	var key string
	var Isendtoendiunique = "true"
	fmt.Println("printing arguments", args)
	var requiredFields []RequiredFields
	var ledgerData LedgerData

	data := []byte(args[0])
	//	var requiredFields RequiredFields
	if err := json.Unmarshal(data, &requiredFields); err != nil {
		panic(err)
	}

	fmt.Println("RequiredFields==========", requiredFields)
	i := 0
	//isUniqueValue := "true"
	for ; i < len(requiredFields); i++ {
		key = requiredFields[i].EndToEndId
		fmt.Println("key=====", key)
		requiredfieldAsbytes, err := stub.GetState(key) //get the var from ledger
		if err != nil {
			fmt.Println("err===", err)
		} else {
			fmt.Println("requiredfieldAsbytes===", string(requiredfieldAsbytes))
		}

		if requiredfieldAsbytes != nil {
			json.Unmarshal(requiredfieldAsbytes, &ledgerData)
			if ledgerData.Ack == "RJCT" || ledgerData.Scroll == "RETURN" {
				continue
			} else {
				Isendtoendiunique = "false"
				fmt.Println("EndToEndId is not unique", key)
				ledgerData.Isendtoendiunique = Isendtoendiunique
				requiredfieldAsbytes, _ := json.Marshal(ledgerData)
				stub.PutState(ledgerData.EndToEndId, requiredfieldAsbytes)
				return shim.Success(requiredfieldAsbytes)
			}
		} else {
			fmt.Println("EndToEnd is unique....", key)
		}
		//fmt.Println("requiredfieldAsbytes===", string(requiredfieldAsbytes))
		//i = i + 1

	}

	return shim.Success([]byte(Isendtoendiunique))
}

//Update Ack file details to ledger
func (t *SimpleChaincode) saveAckDetailsToLedger(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	fmt.Println("starting saveAckDetailsToLedger function....!!!")
	var key, jsonResp string
	//var err error
	fmt.Println("printing arguments", args)
	var status = "true"
	var ackFileData []AckFileData
	var ledgerData LedgerData

	data := []byte(args[0])

	//	var requiredFields RequiredFields
	if err := json.Unmarshal(data, &ackFileData); err != nil {
		panic(err)
	}

	fmt.Println(ackFileData)

	i := 0
	for ; i < len(ackFileData); i++ {
		key = ackFileData[i].OrgnlEndToEndId
		fmt.Println("key=====", key)
		ackFileDataAsbytes, err := stub.GetState(key) //get the var from ledger
		if err != nil {
			jsonResp = "{\"Error\":\"Failed to get state for " + key + "\"}"
			return shim.Error(jsonResp)
		}
		fmt.Println("ackFileDataAsbytes===", string(ackFileDataAsbytes))
		if ackFileDataAsbytes != nil {
			json.Unmarshal(ackFileDataAsbytes, &ledgerData)
			ledgerData.Ack = ackFileData[i].GrpSts
			ledgerDataAsBytes, _ := json.Marshal(ledgerData)
			stub.PutState(ledgerData.EndToEndId, ledgerDataAsBytes)
		}
	}
	fmt.Println("end saveAckDetailsToLedger function....!!!")
	// return shim.Success(requiredFieldsAsBytes)
	return shim.Success([]byte(status))

}

//Update Scroll file details to ledger
func (t *SimpleChaincode) saveScrollDetailsToLedger(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	fmt.Println("starting saveScrollDetailsToLedger function....!!!")
	var key string
	var status = "true"
	fmt.Println("printing arguments", args)

	var scrollFileData []ScrollFileData
	var ledgerData LedgerData

	data := []byte(args[0])

	//	var requiredFields RequiredFields
	if err := json.Unmarshal(data, &scrollFileData); err != nil {
		panic(err)
	}

	fmt.Println(scrollFileData)

	i := 0
	for ; i < len(scrollFileData); i++ {
		key = scrollFileData[i].EndToEndId
		fmt.Println("key=====", key)
		scrollFileDataAsbytes, err := stub.GetState(key) //get the var from ledger
		if err != nil {
			fmt.Println(key, "Key Not found")
			//jsonResp = "{\"Error\":\"Failed to get state for " + key + "\"}"
			// return shim.Error(jsonResp)
			continue
		}
		fmt.Println("scrollFileDataAsbytes===", string(scrollFileDataAsbytes))
		if scrollFileDataAsbytes != nil {
			json.Unmarshal(scrollFileDataAsbytes, &ledgerData)
			ledgerData.Scroll = scrollFileData[i].Prtry
			ledgerDataAsBytes, _ := json.Marshal(ledgerData)
			stub.PutState(ledgerData.EndToEndId, ledgerDataAsBytes)
		}
	}
	fmt.Println("end saveScrollDetailsToLedger function....!!!")
	// return shim.Success(requiredFieldsAsBytes)
	return shim.Success([]byte(status))
}
