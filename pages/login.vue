<template>
  <v-app dark>
    <v-content>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="4">
            <v-card class="elevation-12" :disabled="loading" :loading="loading">
              <v-form ref="form" v-model="valid" @submit.prevent="connect()">
                <v-card-text>
                  <v-text-field
                    v-model="token"
                    :rules="tokenRules"
                    label="input your access token"
                    name="token"
                    append-icon="mdi-account"
                    filled
                    required
                  />
                </v-card-text>
                <v-divider />
                <v-card-actions>
                  <v-spacer />
                  <v-btn :disabled="!valid" type="submit" color="primary">
                    <v-icon class="mr-2">mdi-key-variant</v-icon>
                    Connect
                  </v-btn>
                </v-card-actions>
              </v-form>
            </v-card>
          </v-col>
        </v-row>

        <!-- error dialog -->
        <v-snackbar v-model="errorToast" :timeout="5000" color="error">
          {{ errorMessage }}
          <v-btn text icon @click="errorToast = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-snackbar>
      </v-container>
    </v-content>
  </v-app>
</template>

<script lang="ts" src="./login.ts"></script>
