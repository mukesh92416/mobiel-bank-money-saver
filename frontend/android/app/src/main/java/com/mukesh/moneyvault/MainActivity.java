package com.mukesh.moneyvault;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.mukesh.moneyvault.plugins.UPIIntentLauncherPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(UPIIntentLauncherPlugin.class);
    }
}
