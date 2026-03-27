import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Text "mo:core/Text";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Float "mo:core/Float";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type ExecutiveCredential = {
    name : Text;
    username : Text;
    password : Text;
  };

  type ProfitRecord = {
    id : Text;
    date : Text;
    customerName : Text;
    amountReceived : Float;
    dailyTarget : Float;
    executiveName : Text;
    executiveUsername : Text;
    createdAt : Int;
    isDailyTargetSet : Bool;
  };

  public type UserProfile = {
    name : Text;
    username : Text;
    role : Text;
  };

  // Comparison Modules
  module ProfitRecord {
    public func compareByDate(first : ProfitRecord, second : ProfitRecord) : Order.Order {
      Text.compare(first.date, second.date);
    };

    public func compareByAmountReceived(first : ProfitRecord, second : ProfitRecord) : Order.Order {
      Float.compare(first.amountReceived, second.amountReceived);
    };

    public func compareByDailyTarget(first : ProfitRecord, second : ProfitRecord) : Order.Order {
      Float.compare(first.dailyTarget, second.dailyTarget);
    };

    public func compare(first : ProfitRecord, second : ProfitRecord) : Order.Order {
      Text.compare(first.id, second.id);
    };
  };

  let executiveCredentials = Map.empty<Text, (ExecutiveCredential, Int)>();
  let executivePrincipals = Map.empty<Principal, Text>(); // Maps Principal to username
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Persistent storage
  let profitRecords = Map.empty<Text, ProfitRecord>();

  // Admin credentials
  var adminPassword = "admin123";
  var adminPrincipal : ?Principal = null;

  public type LoginResult = {
    #success : { token : Text; role : Text };
    #invalidCredenetials;
  };

  // User Profile functions (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Authentication functions
  public shared ({ caller }) func authenticateAdmin(username : Text, password : Text) : async Text {
    if (username == "admin" and password == adminPassword) {
      // Assign admin role to this principal
      adminPrincipal := ?caller;
      AccessControl.assignRole(accessControlState, caller, caller, #admin);
      
      // Create/update admin profile
      let profile : UserProfile = {
        name = "Administrator";
        username = "admin";
        role = "admin";
      };
      userProfiles.add(caller, profile);
      
      // Generate a session token using principal and timestamp
      let timestamp = Time.now();
      let token = username.concat("token").concat(timestamp.toText());
      return token;
    } else {
      Runtime.trap("Incorrect admin credentials");
    };
  };

  public shared ({ caller }) func authenticateExecutive(username : Text, password : Text) : async Text {
    switch (executiveCredentials.get(username)) {
      case (null) { Runtime.trap("User does not exist.") };
      case (?cred) {
        if (password == cred.0.password) {
          // Assign user role to this principal
          AccessControl.assignRole(accessControlState, caller, caller, #user);
          executivePrincipals.add(caller, username);
          
          // Create/update executive profile
          let profile : UserProfile = {
            name = cred.0.name;
            username = cred.0.username;
            role = "executive";
          };
          userProfiles.add(caller, profile);
          
          let timestamp = Time.now();
          let token = username.concat("token").concat(timestamp.toText());
          return token;
        } else {
          Runtime.trap("Incorrect executive credentials");
        };
      };
    };
  };

  // Helper function to get executive username for a principal
  func getExecutiveUsername(caller : Principal) : ?Text {
    executivePrincipals.get(caller);
  };

  // Executive functions (admin only)
  public shared ({ caller }) func addExecutive(name : Text, username : Text, password : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can add executives");
    };
    if (executiveCredentials.containsKey(username)) {
      Runtime.trap("Executive with this username already exists.");
    };
    let createdAt = Time.now();
    let newExecutive : ExecutiveCredential = {
      name;
      username;
      password;
    };
    executiveCredentials.add(username, (newExecutive, createdAt));
  };

  public shared ({ caller }) func deleteExecutive(username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can delete executives");
    };
    switch (executiveCredentials.get(username)) {
      case (null) { Runtime.trap("Executive does not exist.") };
      case (_) { executiveCredentials.remove(username) };
    };
  };

  public query ({ caller }) func getAllExecutives() : async [(ExecutiveCredential, Int)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can view all executives");
    };
    executiveCredentials.values().toArray();
  };

  public query ({ caller }) func getExecutive(username : Text) : async ExecutiveCredential {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can get executives");
    };
    switch (executiveCredentials.get(username)) {
      case (null) { Runtime.trap("Executive does not exist.") };
      case (?cred) { cred.0 };
    };
  };

  public query ({ caller }) func getExecutiveName(executiveUsername : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can get executive names");
    };
    switch (executiveCredentials.get(executiveUsername)) {
      case (null) { Runtime.trap("Executive does not exist.") };
      case (?cred) { cred.0.name };
    };
  };

  // Profit record functions
  public shared ({ caller }) func addProfitRecordAsAdmin(
    id : Text,
    date : Text,
    customerName : Text,
    amountReceived : Float,
    dailyTarget : Float,
    executiveName : Text,
    executiveUsername : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can add profit records with daily targets");
    };

    if (profitRecords.containsKey(id)) { Runtime.trap("Profit record with this ID already exists.") };

    let newRecord : ProfitRecord = {
      id;
      date;
      customerName;
      amountReceived;
      dailyTarget;
      executiveName;
      executiveUsername;
      createdAt = Int.abs(Time.now());
      isDailyTargetSet = true;
    };

    profitRecords.add(newRecord.id, newRecord);
  };

  public shared ({ caller }) func addProfitRecordAsExecutive(
    id : Text,
    date : Text,
    customerName : Text,
    amountReceived : Float,
    executiveName : Text,
    executiveUsername : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only executives can add profit records");
    };
    
    // Verify the executive is adding records for themselves
    switch (getExecutiveUsername(caller)) {
      case (null) { Runtime.trap("Executive not authenticated properly") };
      case (?username) {
        if (username != executiveUsername) {
          Runtime.trap("Unauthorized: Can only add records for yourself");
        };
      };
    };
    
    if (profitRecords.containsKey(id)) { Runtime.trap("Profit record with this ID already exists.") };
    
    let newRecord : ProfitRecord = {
      id;
      date;
      customerName;
      amountReceived;
      dailyTarget = 0;
      executiveName;
      executiveUsername;
      createdAt = Int.abs(Time.now());
      isDailyTargetSet = false;
    };
    profitRecords.add(newRecord.id, newRecord);
  };

  public query ({ caller }) func getAllProfitRecords() : async [ProfitRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can get all profit records");
    };
    profitRecords.values().toArray().sort();
  };

  // Filtering function to annual records by executive
  public query ({ caller }) func getAnnualProfitRecordsByExecutive(executiveUsername : Text, year : Text) : async [ProfitRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only executives can view records");
    };
    
    // Verify the executive is viewing their own records
    switch (getExecutiveUsername(caller)) {
      case (null) { Runtime.trap("Executive not authenticated properly") };
      case (?username) {
        if (username != executiveUsername) {
          Runtime.trap("Unauthorized: Can only view your own records");
        };
      };
    };
    
    profitRecords.values().toArray().filter(func(record) { record.date.startsWith(#text year) and record.executiveUsername == executiveUsername });
  };

  // Filtering function for annual records
  public query ({ caller }) func getAnnualProfitRecords(year : Text) : async [ProfitRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can get all profit records");
    };
    profitRecords.values().toArray().filter(func(record) { record.date.startsWith(#text year) });
  };

  // Filtering function to monthly records by executive
  public query ({ caller }) func getMonthlyProfitRecordsByExecutive(executiveUsername : Text, yearMonth : Text) : async [ProfitRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only executives can view records");
    };
    
    // Verify the executive is viewing their own records
    switch (getExecutiveUsername(caller)) {
      case (null) { Runtime.trap("Executive not authenticated properly") };
      case (?username) {
        if (username != executiveUsername) {
          Runtime.trap("Unauthorized: Can only view your own records");
        };
      };
    };
    
    profitRecords.values().toArray().filter(func(record) { record.date.startsWith(#text yearMonth) and record.executiveUsername == executiveUsername });
  };

  // Filtering function for monthly records
  public query ({ caller }) func getMonthlyProfitRecords(yearMonth : Text) : async [ProfitRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can get all profit records");
    };
    profitRecords.values().toArray().filter(func(record) { record.date.startsWith(#text yearMonth) });
  };

  // Sort records by date
  public query ({ caller }) func getRecordsSortedByDate() : async [ProfitRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can get sorted records");
    };
    profitRecords.values().toArray().sort(ProfitRecord.compareByDate);
  };

  // Sort by amount received
  public query ({ caller }) func getRecordsSortedByAmountReceived() : async [ProfitRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can get sorted records");
    };
    profitRecords.values().toArray().sort(ProfitRecord.compareByAmountReceived);
  };

  // Sort by daily target
  public query ({ caller }) func getRecordsSortedByDailyTarget() : async [ProfitRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can get sorted records");
    };
    profitRecords.values().toArray().sort(ProfitRecord.compareByDailyTarget);
  };

  // Filtering by executive by day
  public query ({ caller }) func getRecordsByExecutiveByDay(executiveUsername : Text, day : Text) : async [ProfitRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only executives can view records");
    };
    
    // Verify the executive is viewing their own records
    switch (getExecutiveUsername(caller)) {
      case (null) { Runtime.trap("Executive not authenticated properly") };
      case (?username) {
        if (username != executiveUsername) {
          Runtime.trap("Unauthorized: Can only view your own records");
        };
      };
    };
    
    profitRecords.values().toArray().filter(func(record) { day == record.date and record.executiveUsername == executiveUsername });
  };

  // Filtering by day
  public query ({ caller }) func getRecordsByDay(day : Text) : async [ProfitRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can get records");
    };
    profitRecords.values().toArray().filter(func(record) { day == record.date });
  };

  public query ({ caller }) func getProfitRecordsForExecutive(executiveUsername : Text) : async [ProfitRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only executives can view records");
    };
    
    // Verify the executive is viewing their own records
    switch (getExecutiveUsername(caller)) {
      case (null) { Runtime.trap("Executive not authenticated properly") };
      case (?username) {
        if (username != executiveUsername) {
          Runtime.trap("Unauthorized: Can only view your own records");
        };
      };
    };
    
    profitRecords.values().toArray().filter(func(record) { record.executiveUsername == executiveUsername });
  };

  // Other filters
  public shared ({ caller }) func deleteProfitRecord(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can delete profit records");
    };
    switch (profitRecords.get(id)) {
      case (null) { Runtime.trap("Profit record does not exist.") };
      case (_) { profitRecords.remove(id) };
    };
  };

  // Admin password management
  public shared ({ caller }) func changeAdminPassword(newPassword : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can change admin password");
    };
    adminPassword := newPassword;
  };

  public query ({ caller }) func isAdminMode() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // Executive password management
  public shared ({ caller }) func changeExecutivePassword(username : Text, newPassword : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only executives can change passwords");
    };
    
    // Verify the executive is changing their own password
    switch (getExecutiveUsername(caller)) {
      case (null) { Runtime.trap("Executive not authenticated properly") };
      case (?callerUsername) {
        if (callerUsername != username) {
          Runtime.trap("Unauthorized: Can only change your own password");
        };
      };
    };
    
    switch (executiveCredentials.get(username)) {
      case (null) { Runtime.trap("Executive does not exist.") };
      case (?cred) {
        let updatedExecutive : ExecutiveCredential = {
          name = cred.0.name;
          username = cred.0.username;
          password = newPassword;
        };
        executiveCredentials.add(username, (updatedExecutive, Time.now()));
      };
    };
  };
};
