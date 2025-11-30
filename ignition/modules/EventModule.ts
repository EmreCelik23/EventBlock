import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EventModule = buildModule("EventModule", (m) => {
  const eventFactory = m.contract("EventFactory");

  return { eventFactory };
});

export default EventModule;