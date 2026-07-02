package com.mukesh.moneyvault.plugins;

import android.app.Activity;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import android.util.Log;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "UPIIntentLauncher")
public class UPIIntentLauncherPlugin extends Plugin {

    private static final String TAG = "UPIIntentLauncher";

    @PluginMethod
    public void launch(PluginCall call) {
        String packageName = call.getString("packageName");
        String upiUri = call.getString("upiUri");

        Log.d(TAG, "launch called with packageName=" + packageName + ", upiUri=" + upiUri);

        if (packageName == null || upiUri == null) {
            Log.e(TAG, "Missing required parameters");
            call.reject("packageName and upiUri are required");
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            Log.e(TAG, "Activity is null, cannot launch intent");
            call.reject("ACTIVITY_NULL", "Activity is null, cannot launch intent");
            return;
        }

        try {
            // Parse the pre-built URI to extract components for Uri.Builder reconstruction
            Uri parsedUri = Uri.parse(upiUri);

            // Rebuild URI using Uri.Builder() to match Google's recommended pattern
            Uri.Builder builder = new Uri.Builder();
            builder.scheme(parsedUri.getScheme());
            builder.authority(parsedUri.getAuthority());

            // Re-encode each query parameter through Uri.Builder for consistent encoding
            for (String paramName : parsedUri.getQueryParameterNames()) {
                String paramValue = parsedUri.getQueryParameter(paramName);
                if (paramValue != null) {
                    builder.appendQueryParameter(paramName, paramValue);
                }
            }

            Uri builtUri = builder.build();

            Log.d(TAG, "URI comparison:");
            Log.d(TAG, "  Original (from backend): " + upiUri);
            Log.d(TAG, "  Built (Uri.Builder):      " + builtUri.toString());
            Log.d(TAG, "  URIs match: " + upiUri.equals(builtUri.toString()));

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setData(builtUri);
            intent.setPackage(packageName);

            Log.d(TAG, "Complete intent before launch:");
            Log.d(TAG, "  Action: " + intent.getAction());
            Log.d(TAG, "  Data URI: " + intent.getDataString());
            Log.d(TAG, "  Package: " + intent.getPackage());
            Log.d(TAG, "  Flags: 0x" + Integer.toHexString(intent.getFlags()));
            Log.d(TAG, "  Categories: " + (intent.getCategories() != null ? intent.getCategories().toString() : "null"));
            Log.d(TAG, "  Component: " + (intent.getComponent() != null ? intent.getComponent().flattenToString() : "null (resolved by system)"));
            Log.d(TAG, "  Scheme: " + (intent.getData() != null ? intent.getData().getScheme() : "null"));
            Log.d(TAG, "  Host: " + (intent.getData() != null ? intent.getData().getHost() : "null"));

            activity.startActivity(intent);
            Log.d(TAG, "Intent launched successfully for package: " + packageName);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            Log.e(TAG, "Activity not found for package: " + packageName, e);
            call.reject("PACKAGE_NOT_FOUND", e.getMessage());
        } catch (SecurityException e) {
            Log.e(TAG, "Security exception for package: " + packageName, e);
            call.reject("PACKAGE_NOT_FOUND", e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "Launch failed for package: " + packageName, e);
            call.reject("LAUNCH_FAILED", e.getMessage());
        }
    }
}
