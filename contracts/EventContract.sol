// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract EventContract {
    address public organizer;
    string public name;
    string public date; 
    string public time;
    string public imageURL;
    
    string public locationName;
    string public city;        
    string public country;     
    string public mapsLink;    

    uint256 public price;
    uint256 public capacity;
    uint256 public soldCount;
    
    uint256 public eventTimestamp; 

    bool public isCancelled = false;

    mapping(address => bool) public hasTicket;
    mapping(address => bool) public isRefunded;

    mapping(address => bool) public isTicketUsed;

    event TicketSold(address indexed buyer, uint256 ticketId);
    event EventCancelled();
    event TicketUsed(address indexed user, uint256 timestamp);

    constructor(
        address _organizer,
        string memory _name,
        string memory _date,
        string memory _time,
        string memory _imageURL,
        string memory _locationName,
        string memory _city,        
        string memory _country,     
        string memory _mapsLink,    
        uint256 _price,
        uint256 _capacity,
        uint256 _eventTimestamp 
    ) {
        organizer = _organizer;
        name = _name;
        date = _date;
        time = _time;
        imageURL = _imageURL;
        locationName = _locationName;
        city = _city;
        country = _country;
        mapsLink = _mapsLink;
        price = _price;
        capacity = _capacity;
        soldCount = 0;
        eventTimestamp = _eventTimestamp;
    }

    function buyTicket() external payable {
        require(!isCancelled, "Etkinlik iptal edildi");

        require(block.timestamp < eventTimestamp, "Satislar kapandi, etkinlik basladi/bitti"); 
        
        require(msg.value == price, "Yanlis miktar");
        require(soldCount < capacity, "Dolu");
        require(!hasTicket[msg.sender], "Zaten biletin var");
        
        hasTicket[msg.sender] = true;

        isRefunded[msg.sender] = false;
        isTicketUsed[msg.sender] = false;

        soldCount++;
        emit TicketSold(msg.sender, soldCount);
    }

    function cancelEvent() external {
        require(msg.sender == organizer, "Yetkisiz");
        require(!isCancelled, "Zaten iptal");

        require(block.timestamp < eventTimestamp, "Gecmis etkinlik iptal edilemez");
        
        isCancelled = true;
        emit EventCancelled();
    }

    function getRefund() external {
        require(isCancelled, "Iptal degil");
        require(hasTicket[msg.sender], "Bileti yok");

        require(!isTicketUsed[msg.sender], "Bilet kullanilmis, iade olmaz");

        require(!isRefunded[msg.sender], "Iade alindi");
        
        isRefunded[msg.sender] = true;
        hasTicket[msg.sender] = false;
        
        payable(msg.sender).transfer(price);
    }

    function withdraw() external {
        require(msg.sender == organizer, "Yetkisiz");
        require(!isCancelled, "Etkinlik iptal edilmis, para cekilemez!");

        require(block.timestamp > eventTimestamp, "Etkinlik bitmeden para cekilemez!"); 
        
        payable(organizer).transfer(address(this).balance);
    }

    function useTicket(address user) external {
        require(msg.sender == organizer, "Sadece organizator kullanabilir");
        require(!isCancelled, "Etkinlik iptal edildi");
        require(hasTicket[user], "Bu kullanicinin bileti yok");
        require(!isTicketUsed[user], "Bilet zaten kullanilmis");

        isTicketUsed[user] = true;
        emit TicketUsed(user, block.timestamp);
    }
}