// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

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
        
        EventContract newEvent = new EventContract(
            msg.sender,
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