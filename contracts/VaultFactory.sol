// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "./PrivateComposableVault.sol";
import "./EncryptedStrategyRegistry.sol";
import "./PrivateRebalancer.sol";
import "./SelectiveDisclosureModule.sol";
import "./YieldRouter.sol";
import "./AllocationMechanismFactory.sol";
import "./VaultRegistry.sol";

contract VaultFactory {
    enum AllocationMechanismType { FIXED, VOTING }

    struct VaultParams {
        address asset;
        string name;
        string symbol;
        address donationAddress;
        AllocationMechanismType allocationMechanismType;
        address[] initialRecipients;     // FIXED variant
        uint256[] initialWeights;        // FIXED variant (plaintext)
        address[] votingCandidates;      // VOTING variant
        uint256 votingEpochDuration;     // VOTING variant
        InEuint16 vaultCreatorFeeEncrypted;
        InEuint16 driftThresholdEncrypted;
        InEuint32 minTimeBetweenRebalancesEncrypted;
        address keeper;
        address emergencyAdmin;
        uint256 maxStrategies;
    }

    struct DeployedVault {
        address vault;
        address registry;
        address rebalancer;
        address disclosureModule;
        address yieldRouter;
        address allocationMechanism;
    }

    VaultRegistry public immutable vaultRegistry;
    AllocationMechanismFactory public immutable mechanismFactory;
    PrivateRebalancer public immutable rebalancerContract; // shared rebalancer

    event VaultCreated(
        address indexed vault,
        address indexed creator,
        address asset,
        address registry,
        address allocationMechanism
    );

    constructor(address _vaultRegistry, address _mechanismFactory) {
        vaultRegistry = VaultRegistry(_vaultRegistry);
        mechanismFactory = AllocationMechanismFactory(_mechanismFactory);
        rebalancerContract = new PrivateRebalancer(address(this));
    }

    function createVault(VaultParams calldata params) external returns (DeployedVault memory deployed) {
        address creator = msg.sender;

        // 1. Deploy vault
        PrivateComposableVault vault = new PrivateComposableVault(
            params.asset,
            params.name,
            params.symbol,
            creator,
            params.keeper,
            params.emergencyAdmin,
            params.donationAddress,
            params.vaultCreatorFeeEncrypted
        );

        // 2. Deploy registry (pass factory as authorized caller for setRebalancer)
        EncryptedStrategyRegistry registry = new EncryptedStrategyRegistry(
            address(vault),
            creator,
            params.maxStrategies == 0 ? 10 : params.maxStrategies,
            address(this)
        );

        // 3. Link rebalancer in registry (factory has permission via onlyVaultOrFactory)
        registry.setRebalancer(address(rebalancerContract));

        // 4. Configure rebalancer for this vault
        rebalancerContract.configureVault(
            address(vault),
            params.driftThresholdEncrypted,
            params.minTimeBetweenRebalancesEncrypted
        );

        // 5. Deploy allocation mechanism
        address mechanism;
        if (params.allocationMechanismType == AllocationMechanismType.FIXED) {
            mechanism = mechanismFactory.createFixed(
                creator,
                params.initialRecipients,
                params.initialWeights
            );
        } else {
            mechanism = mechanismFactory.createVoting(
                address(vault),
                params.keeper,
                creator,
                params.votingEpochDuration,
                params.votingCandidates
            );
        }

        // 6. Deploy yield router
        YieldRouter yieldRouter = new YieldRouter(address(vault), mechanism);

        // 7. Deploy selective disclosure module
        SelectiveDisclosureModule disclosureModule = new SelectiveDisclosureModule(
            address(vault),
            address(registry)
        );

        // 8. Initialize vault with all modules
        vault.initialize(address(registry), address(yieldRouter), address(rebalancerContract));

        // 9. Register in VaultRegistry
        vaultRegistry.register(address(vault), params.asset, params.name, params.symbol, creator);

        deployed = DeployedVault({
            vault: address(vault),
            registry: address(registry),
            rebalancer: address(rebalancerContract),
            disclosureModule: address(disclosureModule),
            yieldRouter: address(yieldRouter),
            allocationMechanism: mechanism
        });

        emit VaultCreated(address(vault), creator, params.asset, address(registry), mechanism);

        return deployed;
    }
}
