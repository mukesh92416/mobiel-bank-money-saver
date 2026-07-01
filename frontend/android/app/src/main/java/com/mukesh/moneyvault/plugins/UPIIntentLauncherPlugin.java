package com.mukesh.moneyvault.plugins;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;

@CapacitorPlugin(name = "UPIIntentLauncher")
public class UPIIntentLauncherPlugin extends Plugin {

    @PluginMethod
    public void launch(PluginCall call) {
        String packageName = call.getString("packageName");
        String upiUri = call.getString("upiUri");

        if (packageName == null || upiUri == null) {
            call.reject("packageName and upiUri are required");
            return;
        }

        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(upiUri));
            intent.setPackage(packageName);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(intent);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("PACKAGE_NOT_FOUND", e);
        } catch (Exception e) {
            call.reject("LAUNCH_FAILED", e);
        }
    }
}
