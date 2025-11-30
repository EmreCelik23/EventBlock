// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// Aynı klasördeki EventContract dosyasını içeri aktarıyoruz
import "./EventContract.sol";

contract EventFactory {
    EventContract[] public deployedEvents;

    function createEvent(
        string memory name,
        string memory date,
        string memory time,
        string memory imageURL,
        string memory locationName,
        string memory city,
        string memory country,
        string memory mapsLink,
        uint256 price,
        uint256 capacity,
        uint256 eventTimestamp 
    ) public {
        
        // Yeni kontratı oluştururken bu zaman bilgisini de gönderiyoruz
        EventContract newEvent = new EventContract(
            msg.sender,     // organizer
            name,
            date,
            time,
            imageURL,
            locationName,
            city,
            country,
            mapsLink,
            price,
            capacity,
            eventTimestamp  
        );
        
        deployedEvents.push(newEvent);
    }

    function getDeployedEvents() public view returns (EventContract[] memory) {
        return deployedEvents;
    }
}